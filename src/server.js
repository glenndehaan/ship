/**
 * Import base packages
 */
const express = require('express');
const multer = require('multer');

/**
 * Import own modules
 */
const shutdown = require('./modules/shutdown');
const log = require('./modules/logger');
const cron = require('./modules/cron');
const pageVariables = require('./utils/pageVariables');

/**
 * Import controllers
 */
const HealthController = require('./controllers/HealthController');
const HomeController = require('./controllers/HomeController');
const DeploymentController = require('./controllers/DeploymentController');
const ServiceController = require('./controllers/ServiceController');
const TaskController = require('./controllers/TaskController');
const PodController = require('./controllers/PodController');
const ActionController = require('./controllers/ActionController');
const AgentController = require('./controllers/AgentController');

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
const use_kubernetes = process.env.KUBERNETES || false;

/**
 * Trust proxy
 */
app.enable('trust proxy');

/**
 * Implement health check before other modules
 */
HealthController(app);

/**
 * Set template engine
 */
app.set('view engine', 'ejs');
app.set('views', `${__dirname}/template/${use_kubernetes ? 'kubernetes' : 'docker'}`);

/**
 * Enable multer
 */
app.use(multer().none());

/**
 * Enable additional body parsers
 */
app.use(express.urlencoded({extended: false}));
app.use(express.json());

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
 * Output which infrastructure is in use
 */
log.info(use_kubernetes ? '[INFRASTRUCTURE] Using: Kubernetes!' : '[INFRASTRUCTURE] Using: Docker Swarm!');

/**
 * Configure routers/controllers
 */
HomeController(app);
DeploymentController(app);
ServiceController(app);
TaskController(app);
PodController(app);
ActionController(app);
AgentController(app);

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
    log.info('                              ');
    log.info('            &&&&&&&           ');
    log.info('                              ');
    log.info('       &&&&&&&&&&&&&&&&&      ');
    log.info('       &&&    &&&    &&&      ');
    log.info('        &&&&&&&&&&&&&&&       ');
    log.info('    &&&&&&&&&&&&&&&&&&&&&&&   ');
    log.info('     &&&&&&&&&&&&&&&&&&&&&    ');
    log.info('      &&&&&&&&&&&&&&&&&&&     ');
    log.info('       &&&&&&&&&&&&&&&&&      ');
    log.info('                              ');
    log.info('             Ship             ');
    log.info('       By: Glenn de Haan      ');
    log.info('https://github.com/glenndehaan/ship');
    log.info('');

    log.info(`[WEB] App is running on: 0.0.0.0:3000`);

    if(!use_kubernetes) {
        const docker = require('./modules/docker');
        const dockerInfo = await docker.info();
        log.info(`[DOCKER] Connected! ID: ${dockerInfo.ID}, Hostname: ${dockerInfo.Name}`);
    } else {
        const kubernetes = require('./modules/kubernetes');
        const kubernetesInfo = await kubernetes.info();
        log.info(`[KUBERNETES] Connected! Node(s): ${kubernetesInfo.items.length}, Hostname(s): ${kubernetesInfo.items.map((e) => e.metadata.name).join(',')}`);
    }
});

/**
 * Start the cron
 */
cron.start();

/**
 * Handle shutdown events
 */
shutdown(() => {
    server.close(() => {
        console.log('HTTP server closed!');
        cron.stop();
        console.log('CRON stopped!');

        process.exit(0);
    });
});
