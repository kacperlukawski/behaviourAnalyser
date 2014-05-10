var stampit = require('stampit');
var abstractController = require('./abstract');

var apiController = stampit().enclose(function() {
    var database = null;
    var indexManager = null;

    var parseResults = function(data) {
        var results = [];
        for (var i in data) {
            var row = {};
            for (var key in data[i]) {
                if (data[i][key].getProperties) {
                    row[key] = data[i][key].getProperties();
                } else {
                    row[key] = data[i][key];
                }
            }
            
            results.push(row);
        }

        return results;
    };

    /**
     * Sets routes for the controller
     * @param {express} app
     */
    this.setRoutes = function(app) {
        app.get('/api/all', this.all);
        app.get('/api/connections', this.connections);
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
                'results': parseResults(data),
                'total': total
            });
        });
    };

    /**
     * Returns all connections between events that have been already stored in the database
     * @param {request} req
     * @param {response} res
     */
    this.connections = function(req, res) {
        var query = database.queryBuilder();
        query.startAt({
            'from': 'node(*)'
        });
        query.match('from-[attributes:PRECEDES]->to');
        query.returns('from, to, attributes');
        query.execute({}, function(error, data, total) {
            res.json({
                'error': error,
                'results': parseResults(data),
                'total': total
            });
        });
    };

});

module.exports = stampit.compose(abstractController, apiController);