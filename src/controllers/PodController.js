/**
 * Import base packages
 */
const AnsiToHtml = require('ansi-to-html');

/**
 * Import own modules
 */
const kubernetes = require('../modules/kubernetes');

/**
 * Import own utils
 */
const pageVariables = require('../utils/pageVariables');

/**
 * Define global variables
 */
const use_kubernetes = process.env.KUBERNETES || false;

/**
 * Create an ansi converter
 */
const convertAnsi = new AnsiToHtml();

/**
 * Exports all pod controller endpoints
 *
 * @param app
 */
module.exports = (app) => {
    /**
     * GET /deployment/:namespace/:deployment/pod/:pod - Pod Detail Page (Kubernetes Only)
     */
    app.get('/deployment/:namespace/:deployment/pod/:pod', async (req, res) => {
        if(!use_kubernetes) {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const deployment = await kubernetes.getDeployment(req.params.namespace, req.params.deployment);

        if(typeof deployment.spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const pod = await kubernetes.getPod(req.params.namespace, req.params.deployment, req.params.pod);

        if(typeof pod.spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const logs = await kubernetes.getPodLogs(req.params.namespace, req.params.deployment, pod.spec.containers[0].name, req.params.pod, req.query.timestamps);
        const pod_logs = convertAnsi.toHtml(logs);

        res.render('pod', {
            ...await pageVariables(req),
            page_title: `Pod: ${req.params.pod}`,
            allow_overflow: true,
            deployment,
            pod,
            pod_logs,
            pod_metrics: await kubernetes.getPodMetrics(req.params.namespace, req.params.deployment, pod.spec.containers[0].name, req.params.pod),
            log_label_timestamps: req.query.timestamps ? 'Hide Timestamps' : 'Show Timestamps',
            log_url_timestamps: req.query.timestamps ? `/deployment/${req.params.namespace}/${req.params.deployment}/pod/${req.params.pod}${req.query.details ? '?details=true' : ''}` : `/deployment/${req.params.namespace}/${req.params.deployment}/pod/${req.params.pod}?timestamps=true${req.query.details ? '&details=true' : ''}`
        });
    });

    /**
     * /deployment/:namespace/:deployment/pod/:pod/logs/download - Pod Logs Downloads Export Button (Kubernetes Only)
     */
    app.get('/deployment/:namespace/:deployment/pod/:pod/logs/download', async (req, res) => {
        if(!use_kubernetes) {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const deployment = await kubernetes.getDeployment(req.params.namespace, req.params.deployment);

        if(typeof deployment.spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const pod = await kubernetes.getPod(req.params.namespace, req.params.deployment, req.params.pod);

        if(typeof pod.spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const logs = await kubernetes.getPodLogs(req.params.namespace, req.params.deployment, pod.spec.containers[0].name, req.params.pod, req.query.timestamps);
        const pod_logs = logs.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

        res.set('Content-Type', 'text/plain');
        res.send(pod_logs);
    });
}
