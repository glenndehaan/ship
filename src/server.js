/**
 * Import base packages
 */
const express = require('express');
const multer = require('multer');

/**
 * Import own modules
 */
const docker = require('./modules/docker');

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
const logo = process.env.LOGO || '/images/logo_edit.png';
const logo_url = process.env.LOGO_URL || 'https://glenndehaan.com';
const email_placeholder = process.env.EMAIL_PLACEHOLDER || 'user@example.com';

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
        logo,
        logo_url,
        email_placeholder,
        docker_services: await docker.getServices(),
        docker_tasks: await docker.getTasks(),
        edit: false,
        edit_service: {},
        edit_service_name: null
    });
});

app.get('/update/:service', async (req, res) => {
    res.render('home', {
        info: typeof req.query.message === 'string' && req.query.message !== '',
        info_text: req.query.message || '',
        app_title,
        logo,
        logo_url,
        email_placeholder,
        docker_services: await docker.getServices(),
        docker_tasks: await docker.getTasks(),
        edit: true,
        edit_service: await docker.getService(req.params.service),
        edit_service_name: req.params.service
    });
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
app.listen(3000, '0.0.0.0', async () => {
    log.info(`[WEB] App is running on: 0.0.0.0:3000`);

    const dockerInfo = await docker.info();
    log.info(`[DOCKER] Connected! ID: ${dockerInfo.ID}, Hostname: ${dockerInfo.Name}`);

    const dockerServices = await docker.getServices();
    dockerServices.forEach((serviceInfo) => {
        console.log('serviceInfo', serviceInfo);
    });
});
