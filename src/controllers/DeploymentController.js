/**
 * Import own modules
 */
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

        const events = await kubernetes.getEvents();

        res.render('deployment', {
            ...await pageVariables(req),
            page_title: `Deployment: ${req.params.namespace}/${req.params.deployment}`,
            allow_overflow: true,
            deployment,
            deployment_logs: events.filter((item) => {
                return item.spec.service === `${req.params.namespace}/${req.params.deployment}`;
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

        const events = await kubernetes.getEvents();

        res.render('deployment', {
            ...await pageVariables(req),
            page_title: `Edit Deployment: ${req.params.namespace}/${req.params.deployment}`,
            deployment,
            deployment_logs: events.filter((item) => {
                return item.spec.service === `${req.params.namespace}/${req.params.deployment}`;
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

        const events = await kubernetes.getEvents();

        res.render('deployment', {
            ...await pageVariables(req),
            page_title: `Rollout Restart Deployment: ${req.params.namespace}/${req.params.deployment}`,
            deployment,
            deployment_logs: events.filter((item) => {
                return item.spec.service === `${req.params.namespace}/${req.params.deployment}`;
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

        const events = await kubernetes.getEvents();

        res.render('deployment', {
            ...await pageVariables(req),
            page_title: `Scale Deployment: ${req.params.namespace}/${req.params.deployment}`,
            deployment,
            deployment_logs: events.filter((item) => {
                return item.spec.service === `${req.params.namespace}/${req.params.deployment}`;
            }),
            scale: true,
            scale_service: deployment
        });
    });

    /**
     * GET /deployment/:namespace/:deployment/history/download - Deployment Kubernetes History Downloads Export Button (Kubernetes Only)
     */
    app.get('/deployment/:namespace/:deployment/history/download', async (req, res) => {
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

        const events = await kubernetes.getEvents();

        res.set('Content-Type', 'text/plain');
        res.send(events.filter((item) => {
            return item.spec.service === `${req.params.namespace}/${req.params.deployment}`;
        }).map((item) => {
            let message = '';

            if(item.spec.type === 'attempt_update') {
                message = 'Attempted to update the service during lockout days/hours';
            }
            if(item.spec.type === 'attempt_force_update') {
                message = 'Attempted to force re-deploy the service during lockout days/hours';
            }
            if(item.spec.type === 'attempt_scale') {
                message = 'Attempted to scale the service during lockout days/hours';
            }
            if(item.spec.type === 'attempt_restore') {
                message = 'Attempted to restore the service during lockout days/hours';
            }
            if(item.spec.type === 'update') {
                message = `Updated the service image version from ${item.spec.parameters.old_image_version.split('@')[0]} to ${item.spec.parameters.new_image_version.split('@')[0]}`;
            }
            if(item.spec.type === 'force_update') {
                message = 'Force re-deployed the service';
            }
            if(item.spec.type === 'scale') {
                message = `Scaled the service to ${item.spec.parameters.scale} container(s)`;
            }
            if(item.spec.type === 'restore') {
                message = 'Restored the service';
            }

            return `[${new Date(item.spec.time).toLocaleTimeString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC', timeZoneName: 'short', hour12: false })}] ${item.spec.username}: ${message}`;
        }).join('\n'));
    });
}
