/**
 * Import vendor modules
 */
const os = require('os');

/**
 * Exports all health controller endpoints
 *
 * @param app
 */
module.exports = (app) => {
    /**
     * GET /_health - Health check page
     */
    app.get('/_health', async (req, res) => {
        res.json({
            status: 'UP',
            host: os.hostname(),
            load: process.cpuUsage(),
            mem: process.memoryUsage(),
            uptime: process.uptime()
        });
    });
};
