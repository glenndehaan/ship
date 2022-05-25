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
        res.render(req.cookies.ship_experimental_ui ? 'home_new' : 'home', {
            ...await pageVariables(req),
            page_title: 'Service Overview',
            allow_overflow: true
        });
    });
};
