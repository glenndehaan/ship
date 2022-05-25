/**
 * Import base packages
 */
const AnsiToHtml = require('ansi-to-html');

/**
 * Import own modules
 */
const docker = require('../modules/docker');
const demux = require('../modules/demux');

/**
 * Import own utils
 */
const pageVariables = require('../utils/pageVariables');

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
     * GET /service/:service/task/:task - Task Detail Page
     */
    app.get('/service/:service/task/:task', async (req, res) => {
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

        const logs = await docker.getTaskLogs(req.params.task);
        const task_logs = logs.length > 0 ? convertAnsi.toHtml(demux(logs).join('')) : '1:M 04 May 2022 09:26:00.642 # WARNING overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add \'vm.overcommit_memory = 1\' to /etc/sysctl.conf and then reboot or run the command \'sysctl vm.overcommit_memory=1\' for this to take effect.';

        res.render('task', {
            ...await pageVariables(req),
            page_title: `Task: ${req.params.task}`,
            allow_overflow: true,
            service,
            task,
            task_logs
        });
    });

    /**
     * /service/:service/task/:task/logs/download - Task Docker Logs Downloads Export Button
     */
    app.get('/service/:service/task/:task/logs/download', async (req, res) => {
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

        const logs = await docker.getTaskLogs(req.params.task);
        const task_logs = logs.length > 0 ? demux(logs).join('') : '1:M 04 May 2022 09:26:00.642 # WARNING overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add \'vm.overcommit_memory = 1\' to /etc/sysctl.conf and then reboot or run the command \'sysctl vm.overcommit_memory=1\' for this to take effect.';

        res.set('Content-Type', 'text/plain');
        res.send(task_logs);
    });
}
