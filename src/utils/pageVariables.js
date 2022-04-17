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
 * Returns the base page variables
 *
 * @param req
 * @param db
 * @param globals
 * @return {{}}
 */
module.exports = async (req, db, globals) => {
    return {
        getTimeAgo: time,
        info: typeof req.query.message === 'string' && req.query.message !== '',
        info_text: req.query.message || '',
        search: req.query.search || '',
        app_title: globals.app_title,
        debug_docker: globals.debug_docker,
        hostname: os.hostname(),
        username: globals.auth_header ? crypto.createHash('md5').update(req.get(globals.auth_header)).digest("hex") : false,
        logs_activity: db.getData('/logs'),
        docker_services: await docker.getServices(req.query.search || ''),
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
        force_update_service: {},
        scale: false,
        max_scale: globals.max_scale,
        scale_service: {},
        activity: false,
        activity_service: '',
        activity_logs: []
    };
}
