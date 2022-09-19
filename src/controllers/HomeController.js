/**
 * Import own modules
 */
const docker = require('../modules/docker');

/**
 * Import own utils
 */
const pageVariables = require('../utils/pageVariables');

/**
 * Define global variables
 */
const use_kubernetes = process.env.KUBERNETES || false;

/**
 * Exports all home controller endpoints
 *
 * @param app
 */
module.exports = (app) => {
    /**
     * GET / - Homepage
     */
    app.get('/', async (req, res) => {
        res.render('home', {
            ...await pageVariables(req),
            page_title: `${use_kubernetes ? 'Deployment' : 'Service'} Overview`,
            allow_overflow: true
        });
    });

    /**
     * GET /nodes - Nodes Overview
     */
    app.get('/nodes', async (req, res) => {
        res.render('nodes', {
            ...await pageVariables(req),
            page_title: 'Nodes Overview',
            allow_overflow: true
        });
    });

    /**
     * GET /ingress - Ingress Overview (Kubernetes Only)
     */
    app.get('/ingress', async (req, res) => {
        res.render('ingress', {
            ...await pageVariables(req),
            page_title: 'Ingress Overview',
            allow_overflow: true
        });
    });

    /**
     * GET /allocation - Allocation Overview (Docker Swarm Only)
     */
    app.get('/allocation', async (req, res) => {
        if(use_kubernetes) {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const nodes = await docker.getNodes();
        const tasks = await docker.getTasks();
        const services = await docker.getServices('', true);

        const extendedNodes = nodes.map((node) => {
            const tasksFiltered = tasks.filter((task) => {
                return node.ID === task.NodeID;
            });

            const tasksExtended = tasksFiltered.map((task) => {
                const service = services.find((service) => service.ID === task.ServiceID);
                return {...task, __service_name: service.Spec.Name};
            })

            return {...node, __tasks: tasksExtended};
        });

        res.render('allocation', {
            ...await pageVariables(req),
            page_title: 'Allocation Overview',
            allow_overflow: true,
            docker_extended_nodes: extendedNodes
        });
    });

    /**
     * GET /usage - Usage Overview (Docker Swarm Only)
     */
    app.get('/usage', async (req, res) => {
        if(use_kubernetes) {
            res.status(404);
            res.render('404', {
                ...await pageVariables(req),
                page_title: `Not Found`
            });
            return;
        }

        const nodes = await docker.getNodes();
        const tasks = await docker.getTasks();

        const extendedNodes = nodes.map((node) => {
            const tasksFiltered = tasks.filter((task) => {
                return node.ID === task.NodeID;
            });
            const cpuUsage = tasksFiltered.filter((task) => {
                return typeof task.Spec.Resources !== "undefined" && typeof task.Spec.Resources.Limits !== "undefined" && typeof task.Spec.Resources.Limits.NanoCPUs !== "undefined";
            }).map((task) => {
                return task.Spec.Resources.Limits.NanoCPUs;
            }).reduce((partialSum, a) => partialSum + a, 0);
            const memoryUsage = tasksFiltered.filter((task) => {
                return typeof task.Spec.Resources !== "undefined" && typeof task.Spec.Resources.Limits !== "undefined" && typeof task.Spec.Resources.Limits.MemoryBytes !== "undefined";
            }).map((task) => {
                return task.Spec.Resources.Limits.MemoryBytes;
            }).reduce((partialSum, a) => partialSum + a, 0);

            return {...node, __tasks: tasksFiltered, __task_cpu_usage: cpuUsage, __task_memory_usage: memoryUsage};
        });

        res.render('usage', {
            ...await pageVariables(req),
            page_title: 'Usage Overview',
            allow_overflow: true,
            docker_extended_nodes: extendedNodes
        });
    });
};
