/**
 * Import own modules
 */
const db = require('../modules/database');
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
 * Exports all deployment controller endpoints
 *
 * @param app
 */
module.exports = (app) => {
    /**
     * GET /deployment/:namespace/:deployment - Deployment Detail Page (Kubernetes Only)
     */
    app.get('/deployment/:namespace/:deployment', async (req, res) => {
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

        res.render('deployment', {
            ...await pageVariables(req),
            page_title: `Deployment: ${req.params.namespace}/${req.params.deployment}`,
            allow_overflow: true,
            deployment,
            deployment_logs: db.getData('/logs').filter((item) => {
                return item.service === req.params.deployment;
            })
        });
    });
}
