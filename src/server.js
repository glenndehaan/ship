/**
 * Import base packages
 */
const os = require('os');
const express = require('express');
const multer = require('multer');

/**
 * Import own modules
 */
const docker = require('./modules/docker');
const registry = require('./modules/registry');

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
 * Define global variables
 */
const app_title = process.env.APP_TITLE || 'Ship';
const debug_docker = process.env.DEBUG_DOCKER || false;

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
        info: typeof req.query.message === 'string' && req.query.message !== '',
        info_text: req.query.message || '',
        app_title,
        debug_docker,
        hostname: os.hostname(),
        docker_services: await docker.getServices(),
        docker_tasks: await docker.getTasks(),
        edit: false,
        edit_service: {},
        edit_service_name: null,
        edit_service_image_tags: [],
        logs: false,
        logs_type: '',
        logs_data: {
            service: {
                self: {},
                logs: ''
            },
            task: {
                self: {},
                logs: ''
            }
        },
        force_update: false,
        force_update_service: {}
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
        info: typeof req.query.message === 'string' && req.query.message !== '',
        info_text: req.query.message || '',
        app_title,
        debug_docker,
        hostname: os.hostname(),
        docker_services: await docker.getServices(),
        docker_tasks: await docker.getTasks(),
        edit: true,
        edit_service: service,
        edit_service_name: req.params.service,
        edit_service_image_tags: await registry.getImageTags(service.Spec.TaskTemplate.ContainerSpec.Image.split(':')[0]),
        logs: false,
        logs_type: '',
        logs_data: {
            service: {
                self: {},
                logs: ''
            },
            task: {
                self: {},
                logs: ''
            }
        },
        force_update: false,
        force_update_service: {}
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
        info: typeof req.query.message === 'string' && req.query.message !== '',
        info_text: req.query.message || '',
        app_title,
        debug_docker,
        hostname: os.hostname(),
        docker_services: await docker.getServices(),
        docker_tasks: await docker.getTasks(),
        edit: false,
        edit_service: {},
        edit_service_name: null,
        edit_service_image_tags: [],
        logs: false,
        logs_type: '',
        logs_data: {
            service: {
                self: {},
                logs: ''
            },
            task: {
                self: {},
                logs: ''
            }
        },
        force_update: true,
        force_update_service: service
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
        info: typeof req.query.message === 'string' && req.query.message !== '',
        info_text: req.query.message || '',
        app_title,
        debug_docker,
        hostname: os.hostname(),
        docker_services: await docker.getServices(),
        docker_tasks: await docker.getTasks(),
        edit: false,
        edit_service: {},
        edit_service_name: null,
        edit_service_image_tags: [],
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
        },
        force_update: false,
        force_update_service: {}
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
    const reversedLogs = logs.toString('utf-8').replace(/[^\x00-\x7F]/g, '').split(/\r?\n/).reverse().join('\n');

    res.render('home', {
        info: typeof req.query.message === 'string' && req.query.message !== '',
        info_text: req.query.message || '',
        app_title,
        debug_docker,
        hostname: os.hostname(),
        docker_services: await docker.getServices(),
        docker_tasks: await docker.getTasks(),
        edit: false,
        edit_service: {},
        edit_service_name: null,
        edit_service_image_tags: [],
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
        },
        force_update: false,
        force_update_service: {}
    });
});

app.post('/update', async (req, res) => {
    await docker.updateService(req.body.service_name, req.body.service_image, req.body.service_new_image_version);
    res.redirect(encodeURI(`/?message=Successfully updated the ${req.body.service_name} service!`));
});

app.post('/force_update', async (req, res) => {
    await docker.updateServiceForce(req.body.service_name);
    res.redirect(encodeURI(`/?message=Successfully force updated the ${req.body.service_name} service!`));
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
    });
});
