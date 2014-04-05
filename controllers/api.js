var stampit = require('stampit');

module.exports = stampit().enclose(function() {
    var sessionsContainer = require('./../helpers/sessionsContainer')();
    var database = null;
    var indexManager = null;

    /**
     * Sets routes for the controller
     * @param {express} app
     */
    this.setRoutes = function(app) {
        app.get('/api/all', this.all);
    };

    /**
     * Sets the database connection
     * @param {neo4j} _database
     */
    this.setDatabase = function(_database) {
        database = _database;
        indexManager = database.index();
        var transaction = database.beginTx();
        if (!indexManager.existsForNodes('nodes')) {
            indexManager.forNodes('nodes');
        }
        transaction.success();
        transaction.finish();
    };

    /**
     * Returns all events that have been already stored in the database
     * @param {request} req
     * @param {response} res
     */
    this.all = function(req, res) {
        database.query(
                'MATCH (a)-[:PRECEDES]->(b) \n' +
                'RETURN b._e', function(error, result) {
            res.json({
                'error': error,
                'result': result
            });
        });
    };

});