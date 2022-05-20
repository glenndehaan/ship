/**
 * Import base packages
 */
const log = require('js-logger');
const express = require('express');
const multer = require('multer');
const AnsiToHtml = require('ansi-to-html');
const cookieParser = require('cookie-parser');
const {JsonDB} = require('node-json-db');
const {Config} = require('node-json-db/dist/lib/JsonDBConfig');

/**
 * Import own modules
 */
const docker = require('./modules/docker');
const registry = require('./modules/registry');
const demux = require('./modules/demux');
const lockout = require('./modules/lockout');
const webhook = require('./modules/webhook');
const slack = require('./modules/slack');
const email = require('./modules/email');
const cron = require('./modules/cron');
const pageVariables = require('./utils/pageVariables');

/**
 * Create express app
 *
 * @type {*|Express}
 */
const app = express();

/**
 * Create an ansi converter
 */
const convertAnsi = new AnsiToHtml();

/**
 * Check if we are using the dev version
 */
const dev = process.env.NODE_ENV !== 'production';

/**
 * Setup logger
 */
const consoleLogger = log.createDefaultHandler({
    formatter: (messages, context) => {
        // Get current date, change this to the current timezone, then generate a date-time string
        const utcDate = new Date();
        const offset = utcDate.getTimezoneOffset();
        const date = new Date(utcDate.getTime() - (offset * 60 * 1000));
        const dateTimeString = date.toISOString().replace('T', ' ').replace('Z', '');

        // Prefix each log message with a timestamp and log level
        messages.unshift(`${dateTimeString} ${context.level.name}${context.level.name === 'INFO' || context.level.name === 'WARN' ? ' ' : ''}`);
    }
});

/**
 * Set all logger handlers
 */
log.setHandler((messages, context) => {
    consoleLogger(messages, context);
});

/**
 * Set log level
 */
log.setLevel(dev ? log.TRACE : log.INFO);

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
const max_scale = process.env.MAX_SCALE || '20';
const auth_header = process.env.AUTH_HEADER || false;
const custom_webhook = process.env.CUSTOM_WEBHOOK || false;
const slack_webhook = process.env.SLACK_WEBHOOK || false;
const email_smtp_host = process.env.EMAIL_SMTP_HOST || false;

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
 * Enable cookie parser
 */
app.use(cookieParser());

/**
 * Request logger
 */
app.use((req, res, next) => {
    log.debug(`[Web][REQUEST]: ${req.originalUrl}`);
    next();
});

/**
 * Serve static public dir
 */
app.use(express.static(`${__dirname}/public`));

/**
 * Output notification module status
 */
log.info(slack_webhook ? '[SLACK] Enabled!' : '[SLACK] Disabled!');
log.info(email_smtp_host ? '[EMAIL] Enabled!' : '[EMAIL] Disabled!');

/**
 * Configure routers
 */
app.get('/', async (req, res) => {
    res.render(req.cookies.ship_experimental_ui ? 'home_new' : 'home', {
        ...await pageVariables(req, db),
        page_title: 'Service Overview',
        allow_overflow: true
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
        ...await pageVariables(req, db),
        page_title: `Edit Service: ${req.params.service}`,
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
        ...await pageVariables(req, db),
        page_title: `Force Update Service: ${req.params.service}`,
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
        ...await pageVariables(req, db),
        page_title: `Scale Service: ${req.params.service}`,
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
    const reversedLogs = convertAnsi.toHtml(demux(logs).join(''));

    res.render('home', {
        ...await pageVariables(req, db),
        page_title: `Service logs: ${req.params.service}`,
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
    const reversedLogs = convertAnsi.toHtml(demux(logs).join(''));

    res.render('home', {
        ...await pageVariables(req, db),
        page_title: `Task logs: ${req.params.task_id}`,
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
        ...await pageVariables(req, db),
        page_title: `Activity logs: ${req.params.service}`,
        activity: true,
        activity_service: req.params.service,
        activity_logs: db.getData('/logs').filter((item) => {
            return item.service === req.params.service;
        })
    });
});

app.post('/update', async (req, res) => {
    if(!lockout(auth_header ? req.get(auth_header) : 'Anonymous', req.body.service_name)) {
        db.push('/logs[]', {
            type: 'attempt_update',
            username: auth_header ? req.get(auth_header) : 'Anonymous',
            service: req.body.service_name,
            params: {},
            time: new Date().getTime()
        });

        if(custom_webhook) {
            const webhooks = custom_webhook.split(',');
            for(let item = 0; item < webhooks.length; item++) {
                webhook(webhooks[item], {
                    type: 'attempt_update',
                    username: auth_header ? req.get(auth_header) : 'Anonymous',
                    service: req.body.service_name,
                    params: {},
                    time: new Date().getTime()
                });
            }
        }

        if(slack_webhook) {
            slack({
                fallback: `Attempt to update the ${req.body.service_name} service during lockout days/hours\n\n---`,
                text: `Attempt to update the ${req.body.service_name} service during lockout days/hours\n\n---`,
                color: 'danger',
                fields: [
                    {
                        title: 'User',
                        value: auth_header ? req.get(auth_header) : 'Anonymous',
                        short: false
                    },
                    {
                        title: 'Service',
                        value: req.body.service_name,
                        short: false
                    }
                ]
            });
        }

        if(email_smtp_host) {
            const title = `Ship: Attempt to update the ${req.body.service_name} service during lockout days/hours`;
            const message = `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Ship: Attempt to update the ${req.body.service_name} service during lockout days/hours</p><br/><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>User:</b> ${auth_header ? req.get(auth_header) : 'Anonymous'}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Service:</b> ${req.body.service_name}</p>`;
            email(title, message);
        }

        res.redirect(encodeURI(`/?error=Unable to update service during lockout days/hours!`));
        return;
    }

    db.push('/logs[]', {
        type: 'update',
        username: auth_header ? req.get(auth_header) : 'Anonymous',
        service: req.body.service_name,
        params: {
            image: req.body.service_image,
            old_image_version: req.body.service_old_image_version,
            new_image_version: req.body.service_new_image_version
        },
        time: new Date().getTime()
    });

    if(custom_webhook) {
        const webhooks = custom_webhook.split(',');
        for(let item = 0; item < webhooks.length; item++) {
            webhook(webhooks[item], {
                type: 'update',
                username: auth_header ? req.get(auth_header) : 'Anonymous',
                service: req.body.service_name,
                params: {
                    image: req.body.service_image,
                    old_image_version: req.body.service_old_image_version,
                    new_image_version: req.body.service_new_image_version
                },
                time: new Date().getTime()
            });
        }
    }

    if(slack_webhook) {
        slack({
            fallback: `Updated the ${req.body.service_name} service image from ${req.body.service_image}:${req.body.service_old_image_version} to ${req.body.service_image}:${req.body.service_new_image_version}\n\n---`,
            text: `Updated the ${req.body.service_name} service image from ${req.body.service_image}:${req.body.service_old_image_version} to ${req.body.service_image}:${req.body.service_new_image_version}\n\n---`,
            color: 'good',
            fields: [
                {
                    title: 'User',
                    value: auth_header ? req.get(auth_header) : 'Anonymous',
                    short: false
                },
                {
                    title: 'Service',
                    value: req.body.service_name,
                    short: false
                },
                {
                    title: 'Current Image',
                    value: `${req.body.service_image}:${req.body.service_old_image_version}`,
                    short: false
                },
                {
                    title: 'New Image',
                    value: `${req.body.service_image}:${req.body.service_new_image_version}`,
                    short: false
                }
            ]
        });
    }

    if(email_smtp_host) {
        const title = `Ship: Updated the ${req.body.service_name} service image from ${req.body.service_image}:${req.body.service_old_image_version} to ${req.body.service_image}:${req.body.service_new_image_version}`;
        const message = `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Ship: Updated the ${req.body.service_name} service image from ${req.body.service_image}:${req.body.service_old_image_version} to ${req.body.service_image}:${req.body.service_new_image_version}</p><br/><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>User:</b> ${auth_header ? req.get(auth_header) : 'Anonymous'}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Service:</b> ${req.body.service_name}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Current Image:</b> ${req.body.service_image}:${req.body.service_old_image_version}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;"><b>New Image:</b> ${req.body.service_image}:${req.body.service_new_image_version}</p>`;
        email(title, message);
    }

    await docker.updateService(req.body.service_name, req.body.service_image, req.body.service_new_image_version);
    res.redirect(encodeURI(`/?message=Successfully updated the ${req.body.service_name} service!`));
});

app.post('/force_update', async (req, res) => {
    if(!lockout(auth_header ? req.get(auth_header) : 'Anonymous', req.body.service_name)) {
        db.push('/logs[]', {
            type: 'attempt_force_update',
            username: auth_header ? req.get(auth_header) : 'Anonymous',
            service: req.body.service_name,
            params: {},
            time: new Date().getTime()
        });

        if(custom_webhook) {
            const webhooks = custom_webhook.split(',');
            for(let item = 0; item < webhooks.length; item++) {
                webhook(webhooks[item], {
                    type: 'attempt_force_update',
                    username: auth_header ? req.get(auth_header) : 'Anonymous',
                    service: req.body.service_name,
                    params: {},
                    time: new Date().getTime()
                });
            }
        }

        if(slack_webhook) {
            slack({
                fallback: `Attempt to force re-deploy the ${req.body.service_name} service during lockout days/hours\n\n---`,
                text: `Attempt to force re-deploy the ${req.body.service_name} service during lockout days/hours\n\n---`,
                color: 'danger',
                fields: [
                    {
                        title: 'User',
                        value: auth_header ? req.get(auth_header) : 'Anonymous',
                        short: false
                    },
                    {
                        title: 'Service',
                        value: req.body.service_name,
                        short: false
                    }
                ]
            });
        }

        if(email_smtp_host) {
            const title = `Ship: Attempt to force re-deploy the ${req.body.service_name} service during lockout days/hours`;
            const message = `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Ship: Attempt to force re-deploy the ${req.body.service_name} service during lockout days/hours</p><br/><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>User:</b> ${auth_header ? req.get(auth_header) : 'Anonymous'}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Service:</b> ${req.body.service_name}</p>`;
            email(title, message);
        }

        res.redirect(encodeURI(`/?error=Unable to force re-deploy service during lockout days/hours!`));
        return;
    }

    db.push('/logs[]', {
        type: 'force_update',
        username: auth_header ? req.get(auth_header) : 'Anonymous',
        service: req.body.service_name,
        params: {},
        time: new Date().getTime()
    });

    if(custom_webhook) {
        const webhooks = custom_webhook.split(',');
        for(let item = 0; item < webhooks.length; item++) {
            webhook(webhooks[item], {
                type: 'force_update',
                username: auth_header ? req.get(auth_header) : 'Anonymous',
                service: req.body.service_name,
                params: {},
                time: new Date().getTime()
            });
        }
    }

    if(slack_webhook) {
        slack({
            fallback: `Force re-deployed the ${req.body.service_name} service\n\n---`,
            text: `Force re-deployed the ${req.body.service_name} service\n\n---`,
            color: 'good',
            fields: [
                {
                    title: 'User',
                    value: auth_header ? req.get(auth_header) : 'Anonymous',
                    short: false
                },
                {
                    title: 'Service',
                    value: req.body.service_name,
                    short: false
                }
            ]
        });
    }

    if(email_smtp_host) {
        const title = `Ship: Force re-deployed the ${req.body.service_name} service`;
        const message = `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Ship: Force re-deployed the ${req.body.service_name} service</p><br/><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>User:</b> ${auth_header ? req.get(auth_header) : 'Anonymous'}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Service:</b> ${req.body.service_name}</p>`;
        email(title, message);
    }

    await docker.updateServiceForce(req.body.service_name);
    res.redirect(encodeURI(`/?message=Successfully force updated the ${req.body.service_name} service!`));
});

app.post('/scale', async (req, res) => {
    if(!lockout(auth_header ? req.get(auth_header) : 'Anonymous', req.body.service_name)) {
        db.push('/logs[]', {
            type: 'attempt_scale',
            username: auth_header ? req.get(auth_header) : 'Anonymous',
            service: req.body.service_name,
            params: {},
            time: new Date().getTime()
        });

        if(custom_webhook) {
            const webhooks = custom_webhook.split(',');
            for(let item = 0; item < webhooks.length; item++) {
                webhook(webhooks[item], {
                    type: 'attempt_scale',
                    username: auth_header ? req.get(auth_header) : 'Anonymous',
                    service: req.body.service_name,
                    params: {},
                    time: new Date().getTime()
                });
            }
        }

        if(slack_webhook) {
            slack({
                fallback: `Attempt to scale the ${req.body.service_name} service during lockout days/hours\n\n---`,
                text: `Attempt to scale the ${req.body.service_name} service during lockout days/hours\n\n---`,
                color: 'danger',
                fields: [
                    {
                        title: 'User',
                        value: auth_header ? req.get(auth_header) : 'Anonymous',
                        short: false
                    },
                    {
                        title: 'Service',
                        value: req.body.service_name,
                        short: false
                    }
                ]
            });
        }

        if(email_smtp_host) {
            const title = `Ship: Attempt to scale the ${req.body.service_name} service during lockout days/hours`;
            const message = `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Ship: Attempt to scale the ${req.body.service_name} service during lockout days/hours</p><br/><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>User:</b> ${auth_header ? req.get(auth_header) : 'Anonymous'}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Service:</b> ${req.body.service_name}</p>`;
            email(title, message);
        }

        res.redirect(encodeURI(`/?error=Unable to scale service during lockout days/hours!`));
        return;
    }

    db.push('/logs[]', {
        type: 'scale',
        username: auth_header ? req.get(auth_header) : 'Anonymous',
        service: req.body.service_name,
        params: {
            scale: req.body.service_scale
        },
        time: new Date().getTime()
    });

    if(custom_webhook) {
        const webhooks = custom_webhook.split(',');
        for(let item = 0; item < webhooks.length; item++) {
            webhook(webhooks[item], {
                type: 'scale',
                username: auth_header ? req.get(auth_header) : 'Anonymous',
                service: req.body.service_name,
                params: {
                    scale: req.body.service_scale
                },
                time: new Date().getTime()
            });
        }
    }

    if(slack_webhook) {
        slack({
            fallback: `Scaled the ${req.body.service_name} service to ${req.body.service_scale} container(s)\n\n---`,
            text: `Scaled the ${req.body.service_name} service to ${req.body.service_scale} container(s)\n\n---`,
            color: 'good',
            fields: [
                {
                    title: 'User',
                    value: auth_header ? req.get(auth_header) : 'Anonymous',
                    short: false
                },
                {
                    title: 'Service',
                    value: req.body.service_name,
                    short: false
                },
                {
                    title: 'Scale',
                    value: req.body.service_scale,
                    short: false
                }
            ]
        });
    }

    if(email_smtp_host) {
        const title = `Ship: Scaled the ${req.body.service_name} service to ${req.body.service_scale} container(s)`;
        const message = `<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Ship: Scaled the ${req.body.service_name} service to ${req.body.service_scale} container(s)</p><br/><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>User:</b> ${auth_header ? req.get(auth_header) : 'Anonymous'}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Service:</b> ${req.body.service_name}</p><p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 5px;"><b>Scale:</b> ${req.body.service_scale}</p>`;
        email(title, message);
    }

    await docker.updateServiceScale(req.body.service_name, req.body.service_scale);
    res.redirect(encodeURI(`/?message=Successfully scaled the ${req.body.service_name} service!`));
});

app.get('/enable_experimental_ui', (req, res) => {
    res.cookie('ship_experimental_ui', true, { httpOnly: true });
    res.redirect('/');
});

app.get('/disable_experimental_ui', (req, res) => {
    res.clearCookie('ship_experimental_ui', { httpOnly: true });
    res.redirect('/');
});

/**
 * Setup default 404 message
 */
app.use(async (req, res) => {
    res.status(404);
    res.render('404', {
        ...await pageVariables(req, db),
        page_title: `Not Found`
    });
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
 * Start the cron
 */
cron.start(db, log);

/**
 * Handle SIGTERM for docker
 */
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');

    server.close(() => {
        console.log('HTTP server closed!');
        cron.stop();
        console.log('CRON stopped!');

        process.exit(0);
    });
});
