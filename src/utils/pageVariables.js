/**
 * Import base packages
 */
const os = require('os');
const crypto = require('crypto');

/**
 * Import own modules
 */
const docker = require('../modules/docker');
const time = require('../modules/time');

/**
 * Define global variables
 */
const app_title = process.env.APP_TITLE || 'Ship';
const max_scale = process.env.MAX_SCALE || '20';
const auth_header = process.env.AUTH_HEADER || false;
const debug_docker = process.env.DEBUG_DOCKER || false;
const slack_webhook = process.env.SLACK_WEBHOOK || false;
const email_smtp_host = process.env.EMAIL_SMTP_HOST || false;
const email_to = process.env.EMAIL_TO || false;

/**
 * Returns the base page variables
 *
 * @param req
 * @param db
 * @return {{}}
 */
module.exports = async (req, db) => {
    return {
        getTimeAgo: time,
        info: typeof req.query.message === 'string' && req.query.message !== '',
        info_text: req.query.message || '',
        error: typeof req.query.error === 'string' && req.query.error !== '',
        error_text: req.query.error || '',
        search: req.query.search || '',
        app_title,
        debug_docker,
        slack_webhook,
        email_smtp_host,
        email_to,
        hostname: os.hostname(),
        username: auth_header ? typeof req.get(auth_header) !== "undefined" ? req.get(auth_header) : false : false,
        username_md5: auth_header ? typeof req.get(auth_header) !== "undefined" ? crypto.createHash('md5').update(req.get(auth_header)).digest("hex") : false : false,
        logs_activity: db.getData('/logs'),
        docker_services: await docker.getServices(req.query.search || ''),
        docker_tasks: await docker.getTasks(),
        allow_overflow: false,
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
        force_update_service: {},
        scale: false,
        max_scale: max_scale,
        scale_service: {},
        activity: false,
        activity_service: '',
        activity_logs: []
    };
}
