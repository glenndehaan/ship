/**
 * Import base packages
 */
const AnsiToHtml = require('ansi-to-html');

/**
 * Import own modules
 */
const db = require('../modules/database');
const docker = require('../modules/docker');
const registry = require('../modules/registry');
const demux = require('../modules/demux');

/**
 * Import own utils
 */
const pageVariables = require('../utils/pageVariables');
const regex = require('../utils/regex');

/**
 * Create an ansi converter
 */
const convertAnsi = new AnsiToHtml();

/**
 * Exports all service controller endpoints
 *
 * @param app
 */
module.exports = (app) => {
    /**
     * GET /service/:service - Service Detail Page
     */
    app.get('/service/:service', async (req, res) => {
        const service = await docker.getService(req.params.service);

        if(typeof service.Spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        res.render('service', {
            ...await pageVariables(req),
            page_title: `Service: ${req.params.service}`,
            allow_overflow: true,
            service,
            service_logs: db.getData('/logs').filter((item) => {
                return item.service === req.params.service;
            }),
            traefik_url: regex.getTraefikUrlFromLabels(service.Spec.Labels)
        });
    });

    /**
     * GET /service/:service/logs - Service Docker Logs Page
     */
    app.get('/service/:service/logs', async (req, res) => {
        const service = await docker.getService(req.params.service);

        if(typeof service.Spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const logs = await docker.getServiceLogs(req.params.service);
        const service_logs = logs.length > 0 ? convertAnsi.toHtml(demux(logs).join('')) : '1:M 04 May 2022 09:26:00.642 # WARNING overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add \'vm.overcommit_memory = 1\' to /etc/sysctl.conf and then reboot or run the command \'sysctl vm.overcommit_memory=1\' for this to take effect.';

        res.render('service_logs', {
            ...await pageVariables(req),
            page_title: `Service: ${req.params.service}`,
            allow_overflow: true,
            service,
            service_logs
        });
    });

    /**
     * GET /service/:service/logs/download - Service Docker Logs Downloads Export Button
     */
    app.get('/service/:service/logs/download', async (req, res) => {
        const service = await docker.getService(req.params.service);

        if(typeof service.Spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const logs = await docker.getServiceLogs(req.params.service);
        const service_logs = logs.length > 0 ? convertAnsi.toHtml(demux(logs).join('')) : '1:M 04 May 2022 09:26:00.642 # WARNING overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add \'vm.overcommit_memory = 1\' to /etc/sysctl.conf and then reboot or run the command \'sysctl vm.overcommit_memory=1\' for this to take effect.';

        res.set('Content-Type', 'text/plain');
        res.send(service_logs);
    });

    /**
     * GET /service/:service/history/download - Service Docker History Downloads Export Button
     */
    app.get('/service/:service/history/download', async (req, res) => {
        const service = await docker.getService(req.params.service);

        if(typeof service.Spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        res.set('Content-Type', 'text/plain');
        res.send(db.getData('/logs').filter((item) => {
            return item.service === req.params.service;
        }).map((item) => {
            let message = '';

            if(item.type === 'attempt_update') {
                message = 'Attempted to update the service during lockout days/hours';
            }
            if(item.type === 'attempt_force_update') {
                message = 'Attempted to force re-deploy the service during lockout days/hours';
            }
            if(item.type === 'attempt_scale') {
                message = 'Attempted to scale the service during lockout days/hours';
            }
            if(item.type === 'update') {
                message = `Updated the service image version from ${item.params.old_image_version.split('@')[0]} to ${item.params.new_image_version.split('@')[0]}`;
            }
            if(item.type === 'force_update') {
                message = 'Force re-deployed the service';
            }
            if(item.type === 'scale') {
                message = `Scaled the service to ${item.params.scale} container(s)`;
            }

            return `[${new Date(item.time).toLocaleTimeString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC', timeZoneName: 'short', hour12: false })}] ${item.username}: ${message}`;
        }).join('\n'));
    });

    /**
     * GET /service/:service/update - Update Service Drawer
     */
    app.get('/service/:service/update', async (req, res) => {
        const service = await docker.getService(req.params.service);

        if(typeof service.Spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        res.render('service', {
            ...await pageVariables(req),
            page_title: `Edit Service: ${req.params.service}`,
            service,
            service_logs: db.getData('/logs').filter((item) => {
                return item.service === req.params.service;
            }),
            traefik_url: regex.getTraefikUrlFromLabels(service.Spec.Labels),
            edit: true,
            edit_service: service,
            edit_service_name: req.params.service,
            edit_service_image_tags: await registry.getImageTags(service.Spec.TaskTemplate.ContainerSpec.Image.split(':')[0])
        });
    });

    /**
     * GET /service/:service/force_update - Force Update Service Drawer
     */
    app.get('/service/:service/force_update', async (req, res) => {
        const service = await docker.getService(req.params.service);

        if(typeof service.Spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        res.render('service', {
            ...await pageVariables(req),
            page_title: `Force Update Service: ${req.params.service}`,
            service,
            service_logs: db.getData('/logs').filter((item) => {
                return item.service === req.params.service;
            }),
            traefik_url: regex.getTraefikUrlFromLabels(service.Spec.Labels),
            force_update: true,
            force_update_service: service
        });
    });

    /**
     * GET /service/:service/scale - Scale Service Drawer
     */
    app.get('/service/:service/scale', async (req, res) => {
        const service = await docker.getService(req.params.service);

        if(typeof service.Spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        res.render('service', {
            ...await pageVariables(req),
            page_title: `Scale Service: ${req.params.service}`,
            service,
            service_logs: db.getData('/logs').filter((item) => {
                return item.service === req.params.service;
            }),
            traefik_url: regex.getTraefikUrlFromLabels(service.Spec.Labels),
            scale: true,
            scale_service: service
        });
    });

    /**
     * GET /service/:service/restore - Restore Service Drawer
     */
    app.get('/service/:service/restore', async (req, res) => {
        const service = await docker.getService(req.params.service);

        if(typeof service.Spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        res.render('service', {
            ...await pageVariables(req),
            page_title: `Restore Service: ${req.params.service}`,
            service,
            service_logs: db.getData('/logs').filter((item) => {
                return item.service === req.params.service;
            }),
            traefik_url: regex.getTraefikUrlFromLabels(service.Spec.Labels),
            restore: true,
            restore_service: service
        });
    });
}
