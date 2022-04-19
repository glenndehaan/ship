/**
 * Import base packages
 */
const os = require('os');
const express = require('express');
const multer = require('multer');
const {JsonDB} = require('node-json-db');
const {Config} = require('node-json-db/dist/lib/JsonDBConfig');

/**
 * Import own modules
 */
const docker = require('./modules/docker');
const registry = require('./modules/registry');
const demux = require('./modules/demux');
const time = require('./modules/time');
const pageVariables = require('./utils/pageVariables');

/**
 * Create express app
 *
 * @type {*|Express}
 */
const app = express();

/**
 * Check if we are using the dev version
 */
const dev = process.env.NODE_ENV !== 'production';

/**
 * Setup logger
 */
const log = require('simple-node-logger').createSimpleLogger({
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
});

/**
 * Set log level from config
 */
log.setLevel(dev ? 'trace' : 'info');

/**
 * Initialize a database for logging purposes
 */
const db = new JsonDB(new Config(dev ? `${__dirname}/ship` : `/data/ship`, true, false, '/'));

/**
 * Check if the database base structure exists
 */
if(!db.exists('/logs')) {
    log.info('[DB] Initialized for the first time!');
    db.push('/logs', []);
} else {
    log.info('[DB] Ready!');
}

/**
 * Define global variables
 */
const app_title = process.env.APP_TITLE || 'Ship';
const max_scale = process.env.MAX_SCALE || '20';
const auth_header = process.env.AUTH_HEADER || false;
const debug_docker = process.env.DEBUG_DOCKER || false;
const slack_webhook = process.env.SLACK_WEBHOOK || false;

/**
 * Trust proxy
 */
app.enable('trust proxy');

/**
 * Set template engine
 */
app.set('view engine', 'ejs');
app.set('views', `${__dirname}/template`);

/**
 * Enable multer
 */
app.use(multer().none());

/**
 * Request logger
 */
app.use((req, res, next) => {
    log.trace(`[Web][REQUEST]: ${req.originalUrl}`);
    next();
});

/**
 * Serve static public dir
 */
app.use(express.static(`${__dirname}/public`));

/**
 * Configure routers
 */
app.get('/', async (req, res) => {
    res.render('home', {
        ...await pageVariables(req, db, {
            app_title,
            max_scale,
            auth_header,
            debug_docker,
            slack_webhook
        })
    });
});

app.get('/update/:service', async (req, res) => {
    const service = await docker.getService(req.params.service);

    if(typeof service.Spec === "undefined") {
        res.status(404);
        res.send('Not Found!');
        return;
    }

    res.render('home', {
        ...await pageVariables(req, db, {
            app_title,
            max_scale,
            auth_header,
            debug_docker,
            slack_webhook
        }),
        edit: true,
        edit_service: service,
        edit_service_name: req.params.service,
        edit_service_image_tags: await registry.getImageTags(service.Spec.TaskTemplate.ContainerSpec.Image.split(':')[0])
    });
});

app.get('/force_update/:service', async (req, res) => {
    const service = await docker.getService(req.params.service);

    if(typeof service.Spec === "undefined") {
        res.status(404);
        res.send('Not Found!');
        return;
    }

    res.render('home', {
        ...await pageVariables(req, db, {
            app_title,
            max_scale,
            auth_header,
            debug_docker,
            slack_webhook
        }),
        force_update: true,
        force_update_service: service
    });
});

app.get('/scale/:service', async (req, res) => {
    const service = await docker.getService(req.params.service);

    if(typeof service.Spec === "undefined") {
        res.status(404);
        res.send('Not Found!');
        return;
    }

    res.render('home', {
        ...await pageVariables(req, db, {
            app_title,
            max_scale,
            auth_header,
            debug_docker,
            slack_webhook
        }),
        scale: true,
        max_scale,
        scale_service: service
    });
});

app.get('/logs/service/:service_id', async (req, res) => {
    const service = await docker.getService(req.params.service_id);

    if(typeof service.Spec === "undefined") {
        res.status(404);
        res.send('Not Found!');
        return;
    }

    const logs = await docker.getServiceLogs(req.params.service_id);
    const reversedLogs = logs.toString('utf-8').replace(/[^\x00-\x7F]/g, '').split(/\r?\n/).reverse().join('\n');

    res.render('home', {
        ...await pageVariables(req, db, {
            app_title,
            max_scale,
            auth_header,
            debug_docker,
            slack_webhook
        }),
        logs: true,
        logs_type: 'service',
        logs_data: {
            service: {
                self: service,
                logs: reversedLogs
            },
            task: {
                self: {},
                logs: ''
            }
        }
    });
});

app.get('/logs/task/:task_id', async (req, res) => {
    const task = await docker.getTask(req.params.task_id);

    if(typeof task.Spec === "undefined") {
        res.status(404);
        res.send('Not Found!');
        return;
    }

    const logs = await docker.getTaskLogs(req.params.task_id);
    const reversedLogs = demux(logs).reverse().join('\n');

    res.render('home', {
        ...await pageVariables(req, db, {
            app_title,
            max_scale,
            auth_header,
            debug_docker,
            slack_webhook
        }),
        logs: true,
        logs_type: 'task',
        logs_data: {
            service: {
                self: {},
                logs: ''
            },
            task: {
                self: task,
                logs: reversedLogs
            }
        }
    });
});

app.get('/activity/:service', async (req, res) => {
    res.render('home', {
        ...await pageVariables(req, db, {
            app_title,
            max_scale,
            auth_header,
            debug_docker,
            slack_webhook
        }),
        activity: true,
        activity_service: req.params.service,
        activity_logs: db.getData('/logs').filter((item) => {
            return item.service === req.params.service;
        })
    });
});

app.post('/update', async (req, res) => {
    db.push('/logs[]', {
        username: auth_header ? req.get(auth_header) : 'Anonymous',
        service: req.body.service_name,
        message: `Updated the ${req.body.service_name} service image from ${req.body.service_image}:${req.body.service_old_image_version} to ${req.body.service_image}:${req.body.service_new_image_version}`,
        time: new Date().getTime()
    });
    await docker.updateService(req.body.service_name, req.body.service_image, req.body.service_new_image_version);
    res.redirect(encodeURI(`/?message=Successfully updated the ${req.body.service_name} service!`));
});

app.post('/force_update', async (req, res) => {
    db.push('/logs[]', {
        username: auth_header ? req.get(auth_header) : 'Anonymous',
        service: req.body.service_name,
        message: `Force re-deployed the ${req.body.service_name} service`,
        time: new Date().getTime()
    });
    await docker.updateServiceForce(req.body.service_name);
    res.redirect(encodeURI(`/?message=Successfully force updated the ${req.body.service_name} service!`));
});

app.post('/scale', async (req, res) => {
    db.push('/logs[]', {
        username: auth_header ? req.get(auth_header) : 'Anonymous',
        service: req.body.service_name,
        message: `Scaled the ${req.body.service_name} service to ${req.body.service_scale} container(s)`,
        time: new Date().getTime()
    });
    await docker.updateServiceScale(req.body.service_name, req.body.service_scale);
    res.redirect(encodeURI(`/?message=Successfully scaled the ${req.body.service_name} service!`));
});

/**
 * Setup default 404 message
 */
app.use((req, res) => {
    res.status(404);
    res.send('Not Found!');
});

/**
 * Disable powered by header for security reasons
 */
app.disable('x-powered-by');

/**
 * Start listening on port
 */
const server = app.listen(3000, '0.0.0.0', async () => {
    log.info(`[WEB] App is running on: 0.0.0.0:3000`);

    const dockerInfo = await docker.info();
    log.info(`[DOCKER] Connected! ID: ${dockerInfo.ID}, Hostname: ${dockerInfo.Name}`);
});

/**
 * Handle SIGTERM for docker
 */
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');

    server.close(() => {
        console.log('HTTP server closed!');
        process.exit(0);
    });
});
