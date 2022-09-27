/**
 * Import own modules
 */
const db = require('../modules/database');
const kubernetes = require('../modules/kubernetes');

/**
 * Import own utils
 */
const pageVariables = require('../utils/pageVariables');
const registry = require("../modules/registry");

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
                return item.service === `${req.params.namespace}/${req.params.deployment}`;
            })
        });
    });

    /**
     * GET /deployment/:namespace/:deployment/update - Update Deployment Drawer (Kubernetes Only)
     */
    app.get('/deployment/:namespace/:deployment/update', async (req, res) => {
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
            page_title: `Edit Deployment: ${req.params.namespace}/${req.params.deployment}`,
            deployment,
            deployment_logs: db.getData('/logs').filter((item) => {
                return item.service === `${req.params.namespace}/${req.params.deployment}`;
            }),
            edit: true,
            edit_service: deployment,
            edit_service_name: `${req.params.namespace}/${req.params.deployment}`,
            edit_service_image_tags: await registry.getImageTags(deployment.spec.template.spec.containers[0].image.split(':')[0])
        });
    });

    /**
     * GET /deployment/:namespace/:deployment/force_update - Force Update Deployment Drawer (Kubernetes Only)
     */
    app.get('/deployment/:namespace/:deployment/force_update', async (req, res) => {
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
            page_title: `Rollout Restart Deployment: ${req.params.namespace}/${req.params.deployment}`,
            deployment,
            deployment_logs: db.getData('/logs').filter((item) => {
                return item.service === `${req.params.namespace}/${req.params.deployment}`;
            }),
            force_update: true,
            force_update_service: deployment
        });
    });

    /**
     * GET /deployment/:namespace/:deployment/scale - Scale Deployment Drawer (Kubernetes Only)
     */
    app.get('/deployment/:namespace/:deployment/scale', async (req, res) => {
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
            page_title: `Scale Deployment: ${req.params.namespace}/${req.params.deployment}`,
            deployment,
            deployment_logs: db.getData('/logs').filter((item) => {
                return item.service === `${req.params.namespace}/${req.params.deployment}`;
            }),
            scale: true,
            scale_service: deployment
        });
    });

    /**
     * GET /deployment/:namespace/:deployment/restore - Restore Deployment Drawer (Kubernetes Only)
     */
    app.get('/deployment/:namespace/:deployment/restore', async (req, res) => {
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
            page_title: `Rollback Deployment: ${req.params.namespace}/${req.params.deployment}`,
            deployment,
            deployment_logs: db.getData('/logs').filter((item) => {
                return item.service === `${req.params.namespace}/${req.params.deployment}`;
            }),
            restore: true,
            restore_service: deployment
        });
    });
}
