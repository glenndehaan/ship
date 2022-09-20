/**
 * Import vendor modules
 */
const kubernetes = require('@kubernetes/client-node');

/**
 * Define hidden services
 */
const hiddenServices = typeof process.env.HIDDEN_SERVICES === "undefined" ? [] : process.env.HIDDEN_SERVICES.split(',');

/**
 * Create kubernetes connection
 */
const kubernetesConnection = new kubernetes.KubeConfig();
kubernetesConnection.loadFromDefault();

/**
 * Create kubernetes metrics client
 */
const metricsClient = new kubernetes.Metrics(kubernetesConnection);

/**
 * Create kubernetes apis
 */
const kubernetesCoreApi = kubernetesConnection.makeApiClient(kubernetes.CoreV1Api);
const kubernetesDeploymentApi = kubernetesConnection.makeApiClient(kubernetes.AppsV1Api);
const kubernetesNetworkingApi = kubernetesConnection.makeApiClient(kubernetes.NetworkingV1Api);

/**
 * Kubernetes module functions
 */
const kubernetesModule = {
    /**
     * Return kubernetes info
     *
     * @returns {Promise<*>}
     */
    info: () => {
        return new Promise(async (resolve) => {
            const nodes = await kubernetesCoreApi.listNode().catch((e) => {
                console.error(e);
                process.exit(1);
            });

            resolve(nodes.body);
        });
    },

    /**
     * Get all kubernetes nodes
     *
     * @return {Promise<unknown>}
     */
    getNodes: () => {
        return new Promise(async (resolve) => {
            const nodes = await kubernetesCoreApi.listNode().catch((e) => {
                console.error(e);
                process.exit(1);
            });

            resolve(nodes.body.items.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name)));
        });
    },

    /**
     * Get all kubernetes deployments
     *
     * @param search
     * @param getAll
     * @returns {Promise<unknown>}
     */
    getDeployments: (search = '', getAll = false) => {
        return new Promise(async (resolve) => {
            const allDeployments = await kubernetesDeploymentApi.listDeploymentForAllNamespaces().catch((e) => {
                console.error(e);
                process.exit(1);
            });

            let deployments = allDeployments.body.items;

            if(!getAll) {
                deployments = allDeployments.body.items.filter((deployment) => {
                    return !hiddenServices.includes(deployment.metadata.name);
                });
            }

            // for(let item = 0; item < services.length; item++) {
            //     const service = services[item];
            //
            //     services[item].__tasks = await docker.listTasks({filters: {service: [service.Spec.Name]}}).catch((e) => {
            //         console.error(e);
            //         process.exit(1);
            //     });
            // }

            resolve(deployments.filter((item) => {
                return item.metadata.name.includes(search) || item.metadata.namespace.includes(search);
            }).sort((a, b) => a.metadata.namespace.localeCompare(b.metadata.namespace)));
        });
    },

    /**
     * Get all kubernetes services
     *
     * @returns {Promise<unknown>}
     */
    getServices: () => {
        return new Promise(async (resolve) => {
            const allServices = await kubernetesCoreApi.listServiceForAllNamespaces().catch((e) => {
                console.error(e);
                process.exit(1);
            });

            const services = allServices.body.items.filter((service) => {
                return !hiddenServices.includes(service.metadata.name);
            });

            resolve(services.sort((a, b) => a.metadata.namespace.localeCompare(b.metadata.namespace)));
        });
    },

    /**
     * Get all kubernetes ingress objects
     *
     * @returns {Promise<unknown>}
     */
    getIngress: () => {
        return new Promise(async (resolve) => {
            const ingress = await kubernetesNetworkingApi.listIngressForAllNamespaces().catch((e) => {
                console.error(e);
                process.exit(1);
            });

            resolve(ingress.body.items.sort((a, b) => a.metadata.namespace.localeCompare(b.metadata.namespace)));
        });
    },

    /**
     * Get a kubernetes deployment
     *
     * @param namespace
     * @param name
     * @returns {Promise<unknown>}
     */
    getDeployment: (namespace, name) => {
        return new Promise(async (resolve) => {
            const deployment = await kubernetesDeploymentApi.readNamespacedDeployment(name, namespace).catch((e) => {
                console.error(e);
                process.exit(1);
            });

            if(typeof deployment !== "undefined") {
                const labels = Object.keys(deployment.body.spec.selector.matchLabels).map((key) => {
                    return `${key}=${deployment.body.spec.selector.matchLabels[key]}`;
                });

                const pods = await kubernetesCoreApi.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, labels.join(',')).catch((e) => {
                    console.error(e);
                    process.exit(1);
                });

                deployment.body.__pods = pods.body.items;

                resolve(deployment.body);
            }

            resolve({});
        });
    },

    /**
     * Updates a service image version
     *
     * @param name
     * @param image
     * @param version
     * @returns {Promise<unknown>}
     */
    updateService: (name, image, version) => {
        return new Promise(async (resolve) => {
            const service = await dockerModule.getService(name);
            console.log('service', service);

            if(typeof service.Spec === "undefined") {
                resolve();
                return;
            }

            const opts = service.Spec;
            opts.version = parseInt(service.Version.Index);
            opts.TaskTemplate.ForceUpdate = 0;
            opts.TaskTemplate.ContainerSpec.Image = `${image}:${version}`;
            opts.Labels['com.docker.stack.image'] = `${image}:${version}`;

            console.log('OLD Opts', service.Spec);
            console.log('NEW Opts', opts);

            const result = await docker.getService(service.ID).update({}, opts);

            console.log('result', result);

            resolve();
        });
    },

    /**
     * Force update a service
     *
     * @param name
     * @returns {Promise<unknown>}
     */
    updateServiceForce: (name) => {
        return new Promise(async (resolve) => {
            const service = await dockerModule.getService(name);
            console.log('service', service);

            if(typeof service.Spec === "undefined") {
                resolve();
                return;
            }

            const opts = service.Spec;
            opts.version = parseInt(service.Version.Index);
            opts.TaskTemplate.ForceUpdate = typeof opts.TaskTemplate.ForceUpdate !== "number" ? 1 : opts.TaskTemplate.ForceUpdate + 1;

            console.log('OLD Opts', service.Spec);
            console.log('NEW Opts', opts);

            const result = await docker.getService(service.ID).update({}, opts);

            console.log('result', result);

            resolve();
        });
    },

    /**
     * Updates a service scale
     *
     * @param name
     * @param scale
     * @returns {Promise<unknown>}
     */
    updateServiceScale: (name, scale) => {
        return new Promise(async (resolve) => {
            const service = await dockerModule.getService(name);
            console.log('service', service);

            if(typeof service.Spec === "undefined") {
                resolve();
                return;
            }

            const opts = service.Spec;
            opts.version = parseInt(service.Version.Index);
            opts.Mode.Replicated.Replicas = parseInt(scale);

            console.log('OLD Opts', service.Spec);
            console.log('NEW Opts', opts);

            const result = await docker.getService(service.ID).update({}, opts);

            console.log('result', result);

            resolve();
        });
    },

    /**
     * Restore a service
     *
     * @param name
     * @returns {Promise<unknown>}
     */
    restoreService: (name) => {
        return new Promise(async (resolve) => {
            const service = await dockerModule.getService(name);
            console.log('service', service);

            if(typeof service.Spec === "undefined") {
                resolve();
                return;
            }

            const opts = service.Spec;
            opts.version = parseInt(service.Version.Index);
            opts.rollback = 'previous';

            console.log('OLD Opts', service.Spec);
            console.log('NEW Opts', opts);

            const result = await docker.getService(service.ID).update({}, opts);

            console.log('result', result);

            resolve();
        });
    },

    /**
     * Get the last logs from a service
     *
     * @param name
     * @param details
     * @param timestamps
     * @param amount
     * @returns {*}
     */
    getServiceLogs: (name, details = false, timestamps = false, amount = 250) => {
        return docker.getService(name).logs({
            stdout: true,
            stderr: true,
            details: details,
            timestamps: timestamps,
            tail: amount
        });
    },

    /**
     * Get a kubernetes pod
     *
     * @param namespace
     * @param deployment
     * @param name
     * @returns {Promise<unknown>}
     */
    getPod: (namespace, deployment, name) => {
        return new Promise(async (resolve) => {
            const task = await kubernetesCoreApi.readNamespacedPod(name, namespace).catch((e) => {
                console.error(e);
                process.exit(1);
            });

            if(typeof task !== "undefined") {
                resolve(task.body);
            }

            resolve({});
        });
    },

    /**
     * Get the last logs from a pod
     *
     * @param namespace
     * @param deployment
     * @param container
     * @param name
     * @param amount
     * @param timestamps
     * @returns {Promise<unknown>}
     */
    getPodLogs: (namespace, deployment, container, name, timestamps = false, amount = 250) => {
        return new Promise(async (resolve) => {
            const logs = await kubernetesCoreApi.readNamespacedPodLog(name, namespace, container, undefined, undefined, undefined, undefined, undefined, undefined, amount, timestamps).catch((e) => {
                console.error(e);
                process.exit(1);
            });

            if(typeof logs !== "undefined") {
                resolve(logs.body);
            }

            resolve('');
        });
    },

    /**
     * Get the pod metrics
     *
     * @param namespace
     * @param deployment
     * @param container
     * @param name
     * @returns {Promise<unknown>}
     */
    getPodMetrics: (namespace, deployment, container, name) => {
        return new Promise(async (resolve) => {
            const metrics = await metricsClient.getPodMetrics(namespace, name).catch((e) => {
                console.error(e);
                process.exit(1);
            });

            if(typeof metrics !== "undefined") {
                const containerMetrics = metrics.containers.find((item) => {
                    return item.name === container;
                });

                if(containerMetrics) {
                    resolve(containerMetrics.usage);
                }

                resolve({});
            }

            resolve({});
        });
    }
};

/**
 * Exports the kubernetes module functions
 */
module.exports = kubernetesModule;
