/**
 * Import base packages
 */
const os = require('os');
const crypto = require('crypto');

/**
 * Import own modules
 */
const db = require('../modules/database');
const docker = require('../modules/docker');
const kubernetes = require('../modules/kubernetes');
const memory = require('../modules/memory');
const time = require('../modules/time');
const bytes = require('../modules/bytes');

/**
 * Define global variables
 */
const app_title = process.env.APP_TITLE || 'Ship';
const max_scale = process.env.MAX_SCALE || '20';
const use_kubernetes = process.env.KUBERNETES || false;
const auth_header = process.env.AUTH_HEADER || false;
const debug_docker = process.env.DEBUG_DOCKER || false;
const debug_kubernetes = process.env.DEBUG_KUBERNETES || false;
const custom_webhook = process.env.CUSTOM_WEBHOOK || false;
const slack_webhook = process.env.SLACK_WEBHOOK || false;
const email_smtp_host = process.env.EMAIL_SMTP_HOST || false;
const email_to = process.env.EMAIL_TO || false;
const lockout_service_regex = use_kubernetes ? (process.env.LOCKOUT_DEPLOYMENT_REGEX || '') : (process.env.LOCKOUT_SERVICE_REGEX || '');
const lockout_days = process.env.LOCKOUT_DAYS || '';
const lockout_after_hour = process.env.LOCKOUT_AFTER_HOUR || false;

/**
 * Returns the base page variables
 *
 * @param req
 * @return {{}}
 */
module.exports = async (req) => {
    return {
        getTimeAgo: time,
        getBytes: bytes,
        info: typeof req.query.message === 'string' && req.query.message !== '',
        info_text: req.query.message || '',
        error: typeof req.query.error === 'string' && req.query.error !== '',
        error_text: req.query.error || '',
        search: req.query.search || '',
        app_title,
        debug_docker,
        debug_kubernetes,
        custom_webhook,
        slack_webhook,
        email_smtp_host,
        email_to,
        use_kubernetes,
        hostname: os.hostname(),
        username: auth_header ? typeof req.get(auth_header) !== "undefined" ? req.get(auth_header) : false : false,
        username_md5: auth_header ? typeof req.get(auth_header) !== "undefined" ? crypto.createHash('md5').update(req.get(auth_header)).digest("hex") : false : false,
        logs_activity: !use_kubernetes ? db.getData('/logs') : await kubernetes.getEvents(),
        docker_nodes: !use_kubernetes ? await docker.getNodes() : [],
        docker_services: !use_kubernetes ? await docker.getServices(req.query.search || '') : [],
        docker_tasks: !use_kubernetes ? await docker.getTasks() : [],
        kubernetes_nodes: use_kubernetes ? await kubernetes.getNodes() : [],
        kubernetes_nodes_metrics: use_kubernetes ? await kubernetes.getNodeMetrics() : [],
        kubernetes_ingress: use_kubernetes ? await kubernetes.getIngress() : [],
        kubernetes_services: use_kubernetes ? await kubernetes.getServices() : [],
        kubernetes_deployments: use_kubernetes ? await kubernetes.getDeployments(req.query.search || '') : [],
        agent_data: memory.get('agent'),
        lockout_active: (lockout_days && lockout_days.split(',').includes(`${new Date().getDay()}`)) || (lockout_after_hour && new Date().getHours() >= parseInt(lockout_after_hour)),
        lockout_rule: lockout_service_regex,
        allow_overflow: false,
        deployment: {},
        deployment_logs: [],
        service: {},
        service_logs: [],
        task: {},
        task_logs: [],
        pod: {},
        pod_logs: [],
        pod_metrics: {},
        traefik_url: false,
        edit: false,
        edit_service: {},
        edit_service_name: null,
        edit_service_image_tags: [],
        force_update: false,
        force_update_service: {},
        scale: false,
        max_scale: max_scale,
        scale_service: {},
        restore: false,
        restore_service: {}
    };
}
