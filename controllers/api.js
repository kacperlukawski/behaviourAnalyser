var stampit = require('stampit');
var abstractController = require('./abstract');

var apiController = stampit().enclose(function() {
    var database = null;
    var indexManager = null;

    var parseResults = function(data) {
        var results = [];
        for (i in data) {
            results.push(data[i]['event'].getProperties());
        }

        return results;
    };

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
        var query = database.queryBuilder();
        query.startAt({
            'event': 'node(*)'
        });
        query.returns('event');
        query.execute({}, function(error, data, total) {
            res.json({
                'error': error,
                'data': parseResults(data),
                'total': total
            });
        });
    };

    this.runTask = function(req, res) {
        // TODO
    };

});

module.exports = stampit.compose(abstractController, apiController);