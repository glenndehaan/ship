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
const kubernetesCustomObjectsApi = kubernetesConnection.makeApiClient(kubernetes.CustomObjectsApi);

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
     * Updates a deployment image version
     *
     * @param namespace
     * @param name
     * @param image
     * @param version
     * @returns {Promise<unknown>}
     */
    updateDeployment: (namespace, name, image, version) => {
        return new Promise(async (resolve) => {
            const res = await kubernetesDeploymentApi.readNamespacedDeployment(name, namespace);
            const deployment = res.body;

            if(typeof deployment.spec === "undefined") {
                resolve();
                return;
            }

            deployment.spec.template.spec.containers[0].image = `${image}:${version}`;

            console.log('OLD Opts', res.body);
            console.log('NEW Opts', deployment);

            const result = await kubernetesDeploymentApi.replaceNamespacedDeployment(name, namespace, deployment).catch((e) => {
               console.log(e)
            });

            console.log('result', result);

            resolve();
        });
    },

    /**
     * Force update a deployment
     *
     * @param namespace
     * @param name
     * @returns {Promise<unknown>}
     */
    updateDeploymentForce: (namespace, name) => {
        return new Promise(async (resolve) => {
            const opts = {
                spec: {
                    template: {
                        metadata: {
                            annotations: {
                                'ship.glenndehaan.com/restartedAt': `${new Date().toISOString()}`
                            }
                        }
                    }
                }
            };

            console.log('NEW Opts', opts);

            const result = await kubernetesDeploymentApi.patchNamespacedDeployment(name, namespace, opts, undefined, undefined, undefined, undefined, undefined, {
                headers: {
                    'Content-type': kubernetes.PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH
                }
            });

            console.log('result', result);

            resolve();
        });
    },

    /**
     * Updates a deployment scale
     *
     * @param namespace
     * @param name
     * @param scale
     * @returns {Promise<unknown>}
     */
    updateDeploymentScale: (namespace, name, scale) => {
        return new Promise(async (resolve) => {
            const opts = {
                spec: {
                    replicas: parseInt(scale)
                }
            };

            console.log('NEW Opts', opts);

            const result = await kubernetesDeploymentApi.patchNamespacedDeployment(name, namespace, opts, undefined, undefined, undefined, undefined, undefined, {
                headers: {
                    'Content-type': kubernetes.PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH
                }
            });

            console.log('result', result);

            resolve();
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
    },

    /**
     * Creates a ship event in kubernetes
     *
     * @param data
     */
    createEvent: (data) => {
        kubernetesCustomObjectsApi.createClusterCustomObject('ship.glenndehaan.com', 'v1', 'shipevents', {
            apiVersion: 'ship.glenndehaan.com/v1',
            kind: 'ShipEvent',
            metadata: {
                name: `${Date.now()}`
            },
            spec: data
        }).catch((e) => {
            console.error(e);
            process.exit(1);
        });
    },

    /**
     * Remove a ship event in kubernetes
     *
     * @param name
     */
    deleteEvent: (name) => {
        kubernetesCustomObjectsApi.deleteClusterCustomObject('ship.glenndehaan.com', 'v1', 'shipevents', name).catch((e) => {
            console.error(e);
            process.exit(1);
        });
    },

    /**
     * Get ship events from kubernetes
     *
     * @returns {Promise<unknown>}
     */
    getEvents: () => {
        return new Promise(async (resolve) => {
            const events = await kubernetesCustomObjectsApi.listClusterCustomObject('ship.glenndehaan.com', 'v1', 'shipevents').catch((e) => {
                console.error(e);
                process.exit(1);
            });

            if(typeof events !== "undefined") {
                resolve(events.body.items);
            }

            resolve([]);
        });
    }
};

/**
 * Exports the kubernetes module functions
 */
module.exports = kubernetesModule;
