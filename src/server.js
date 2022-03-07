/**
 * Import base packages
 */
const express = require('express');
const multer = require('multer');
const Docker = require('dockerode');

/**
 * Create express app
 *
 * @type {*|Express}
 */
const app = express();

/**
 * Create docker connection
 *
 * @type {Docker}
 */
const docker = new Docker({
    socketPath: '/var/run/docker.sock'
});

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
app.get('/', (req, res) => {
    res.render('home', {
        info: typeof req.query.message === 'string' && req.query.message !== '',
        info_text: req.query.message || '',
        app_title,
        logo,
        logo_url,
        email_placeholder
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
});

/**
 * Log docker info
 */
docker.info({}, (err, info) => {
    if(err) {
        console.error(err);
        process.exit(1);
        return;
    }

    log.info(`[DOCKER] Connected! ID: ${info.ID}, Hostname: ${info.Name}`);
})

docker.listServices({}, (err, services) => {
    if(err) {
        console.error(err);
        process.exit(1);
        return;
    }

    // console.log('containers', containers);

    services.forEach((serviceInfo) => {
        console.log('serviceInfo', serviceInfo);
    });
});
