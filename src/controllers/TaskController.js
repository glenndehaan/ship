/**
 * Import base packages
 */
const AnsiToHtml = require('ansi-to-html');

/**
 * Import own modules
 */
const docker = require('../modules/docker');
const demux = require('../modules/demux');
const memory = require('../modules/memory');

/**
 * Import own utils
 */
const pageVariables = require('../utils/pageVariables');
const object = require('../utils/object');

/**
 * Define global variables
 */
const use_kubernetes = process.env.KUBERNETES || false;

/**
 * Create an ansi converter
 */
const convertAnsi = new AnsiToHtml();

/**
 * Exports all task controller endpoints
 *
 * @param app
 */
module.exports = (app) => {
    /**
     * GET /service/:service/task/:task - Task Detail Page (Docker Swarm Only)
     */
    app.get('/service/:service/task/:task', async (req, res) => {
        if(use_kubernetes) {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const service = await docker.getService(req.params.service);

        if(typeof service.Spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const task = await docker.getTask(req.params.task);

        if(typeof task.Spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const logs = await docker.getTaskLogs(req.params.task, req.query.details, req.query.timestamps);
        const task_logs = logs.length > 0 ? convertAnsi.toHtml(demux(logs).join('')) : '1:M 04 May 2022 09:26:00.642 # WARNING overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add \'vm.overcommit_memory = 1\' to /etc/sysctl.conf and then reboot or run the command \'sysctl vm.overcommit_memory=1\' for this to take effect.';

        res.render('task', {
            ...await pageVariables(req),
            page_title: `Task: ${req.params.task}`,
            allow_overflow: true,
            service,
            task,
            task_logs,
            agent_data: object.convertMemoryToTasksObject(memory.get('agent')),
            log_label_details: req.query.details ? 'Hide Details' : 'Show Details',
            log_label_timestamps: req.query.timestamps ? 'Hide Timestamps' : 'Show Timestamps',
            log_url_details: req.query.details ? `/service/${service.Spec.Name}/task/${task.ID}${req.query.timestamps ? '?timestamps=true' : ''}` : `/service/${service.Spec.Name}/task/${task.ID}?details=true${req.query.timestamps ? '&timestamps=true' : ''}`,
            log_url_timestamps: req.query.timestamps ? `/service/${service.Spec.Name}/task/${task.ID}${req.query.details ? '?details=true' : ''}` : `/service/${service.Spec.Name}/task/${task.ID}?timestamps=true${req.query.details ? '&details=true' : ''}`
        });
    });

    /**
     * /service/:service/task/:task/logs/download - Task Docker Logs Downloads Export Button (Docker Swarm Only)
     */
    app.get('/service/:service/task/:task/logs/download', async (req, res) => {
        if(use_kubernetes) {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const service = await docker.getService(req.params.service);

        if(typeof service.Spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const task = await docker.getTask(req.params.task);

        if(typeof task.Spec === "undefined") {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const logs = await docker.getTaskLogs(req.params.task, true, true);
        const task_logs = logs.length > 0 ? demux(logs).join('').replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '') : '1:M 04 May 2022 09:26:00.642 # WARNING overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add \'vm.overcommit_memory = 1\' to /etc/sysctl.conf and then reboot or run the command \'sysctl vm.overcommit_memory=1\' for this to take effect.';

        res.set('Content-Type', 'text/plain');
        res.send(task_logs);
    });
}
