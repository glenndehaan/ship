/**
 * Import base packages
 */
const express = require('express');
const multer = require('multer');

/**
 * Import own modules
 */
const log = require('./modules/logger');
const docker = require('./modules/docker');
const cron = require('./modules/cron');
const pageVariables = require('./utils/pageVariables');

/**
 * Import controllers
 */
const HomeController = require('./controllers/HomeController');
const ServiceController = require('./controllers/ServiceController');
const TaskController = require('./controllers/TaskController');
const ActionController = require('./controllers/ActionController');

/**
 * Create express app
 *
 * @type {*|Express}
 */
const app = express();

/**
 * Define global variables
 */
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
 * Request logger
 */
app.use((req, res, next) => {
    log.debug(`[WEB REQUEST]: ${req.originalUrl}`);
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
 * Configure routers/controllers
 */
HomeController(app);
ServiceController(app);
TaskController(app);
ActionController(app);

/**
 * Setup default 404 message
 */
app.use(async (req, res) => {
    res.status(404);
    res.render('404', {
        ...await pageVariables(req),
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
cron.start();

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
