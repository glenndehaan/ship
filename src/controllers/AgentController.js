/**
 * Import own modules
 */
const log = require('../modules/logger');
const memory = require('../modules/memory');

/**
 * Exports all agent controller endpoints
 *
 * @param app
 */
module.exports = (app) => {
    /**
     * POST /agent/:id - Agent Data Call
     */
    app.post('/agent/:id', async (req, res) => {
        const agentId = req.params.id;
        memory.set('agent', agentId, req.body)

        log.info(`[AGENT] Stored agent data for ID: ${agentId}`);

        res.json({
            message: 'OK'
        });
    });
};
