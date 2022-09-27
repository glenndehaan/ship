/**
 * Define global variables
 */
const use_kubernetes = process.env.KUBERNETES || false;

/**
 * Export controller based on system type
 */
if(use_kubernetes) {
    module.exports = require('./actions/KubernetesController');
} else {
    module.exports = require('./actions/DockerController');
}
