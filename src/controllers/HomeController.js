/**
 * Import own utils
 */
const pageVariables = require('../utils/pageVariables');

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
            page_title: 'Service Overview',
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
};
