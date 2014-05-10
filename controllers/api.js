var stampit = require('stampit');
var abstractController = require('./abstract');

var apiController = stampit().enclose(function() {
    var database = null;
    var indexManager = null;

    var parseResults = function(data) {
        if (data.getProperties) {
            // there data is either node or relationship object and need
            // to get all properties and parse them
            return parseResults(data.getProperties());
        }

        if (Object.prototype.toString.call(data) === '[object Array]') {
            // data is an array, so we parse all elements of it
            var isArray = true;
            var results = [];
            for (var idx in data) {
                if (isNaN(parseFloat(idx)) || !isFinite(idx)) {
                    isArray = false;
                    break;
                }

                results.push(parseResults(data[idx]));
            }

            if (isArray) {
                return results;
            }
        }

        if (typeof data === 'object') {
            // data is an object, so all fields of it should be parsed
            var results = {};
            for (var idx in data) {
                results[idx] = parseResults(data[idx]);
            }

            return results;
        }

        return data;
    };

    /**
     * Sets routes for the controller
     * @param {express} app
     */
    this.setRoutes = function(app) {
        app.get('/api/all', this.all);
        app.get('/api/connections', this.connections);
        app.get('/api/cycles', this.cycles);
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
        query.where('HAS(event._id)');
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

    /**
     * Returns all cycles in a graph
     * @param {request} req
     * @param {response} res
     */
    this.cycles = function(req, res) {
        var query = database.queryBuilder();
        query.startAt({
            'from': 'node(*)'
        });
        query.match('cycle = from-[*..10]->from');
        query.where('NOT HAS(from._detour)');
        query.returns('NODES(cycle) AS nodes, RELATIONSHIPS(cycle) AS connections');
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