var Q = require('q');
var stampit = require('stampit');
var abstractController = require('./abstract');

var apiController = stampit().enclose(function() {
    var database = null;
    var indexManager = null;

    var parseResults = function(data) {
        if (data && data.getProperties) {
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
                    // idx is not a number, so it's better to return
                    // object instead of an array
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
        app.get('/api/cycles/:eventId', this.cycles);
        app.get('/api/shortestPath/:startEventId/:endEventId', this.shortestPath);
        app.get('/api/mostProbablePath/:startEventId/:endEventId', this.mostProbablePath);
        app.get('/api/mostProbableMove/:eventId', this.mostProbableMove);
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
     * Returns all events and connections that have been already stored in the database
     * @param {request} req
     * @param {response} res
     */
    this.all = function(req, res) {
        var query = database.queryBuilder();
        query.startAt({
            'from': 'node(*)',
            'to': 'node(*)'
        });
        query.match('p = from-[attributes:PRECEDES]->to');
        query.returns('NODES(p) AS nodes, RELATIONSHIPS(p) AS connections');
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
     * @deprecated
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
        query.match('cycle = from-[attributes:PRECEDES*..10]->from');
        query.where('HAS(from._id) AND from._id = { eventId }');
        query.returns('NODES(cycle) AS nodes, RELATIONSHIPS(cycle) AS connections');
        query.execute({
            'eventId': req.params.eventId
        }, function(error, data, total) {
            res.json({
                'error': error,
                'results': parseResults(data),
                'total': total
            });
        });
    };

    /**
     * Returns the shortest path between selected nodes
     * @param {request} req
     * @param {response} res
     */
    this.shortestPath = function(req, res) {
        var query = database.queryBuilder();
        query.startAt({
            'from': 'node(*)',
            'to': 'node(*)'
        });
        query.match('p = shortestPath(from-[attributes:PRECEDES*..10]->to)');
        query.where('HAS(from._id) AND from._id = { startEventId } AND HAS(to._id) AND to._id = { endEventId }');
        query.returns('NODES(p) AS nodes, RELATIONSHIPS(p) AS connections');
        query.execute({
            'startEventId': req.params.startEventId,
            'endEventId': req.params.endEventId
        }, function(error, data, total) {
            res.json({
                'error': error,
                'results': parseResults(data),
                'total': total
            });
        });
    };

    /**
     * Returns the most probable path between selected nodes
     * @param {request} req
     * @param {response} res
     */
    this.mostProbablePath = function(req, res) {
        database.query(
                'START from = NODE(*), to = NODE(*)\n' +
                'MATCH p = from-[attributes:PRECEDES*..10]->to\n' +
                'WHERE HAS(from._id) AND from._id = { startEventId } AND HAS(to._id) AND to._id = { endEventId }\n' +
                'WITH p, EXTRACT(x in attributes: x.inversedProbability) AS inversedProbabilities, LENGTH(p) AS len\n' +
                'RETURN NODES(p) AS nodes, RELATIONSHIPS(p) AS connections, REDUCE(res = 0, x in inversedProbabilities: res + x) AS cost, inversedProbabilities, len\n' +
                'ORDER BY cost ASC\n' +
                'LIMIT 1', {
                    'startEventId': req.params.startEventId,
                    'endEventId': req.params.endEventId
                }, function(error, data, total) {
            res.json({
                'error': error,
                'results': parseResults(data),
                'total': total
            });
        });
    };

    /**
     * Returns the most probable path between selected nodes
     * @param {request} req
     * @param {response} res
     */
    this.mostProbableMove = function(req, res) {
        database.query(
                'START from = NODE(*), to = NODE(*)\n' +
                'MATCH p = from-[attributes:PRECEDES]->to\n' +
                'WHERE HAS(from._id) AND from._id = { eventId } AND HAS(to._id)\n' +
                'RETURN NODES(p) AS nodes, RELATIONSHIPS(p) AS connections, attributes.probability AS cost\n' +
                'ORDER BY cost DESC\n' +
                'LIMIT 1', {
                    'eventId': req.params.eventId
                }, function(error, data, total) {
            res.json({
                'error': error,
                'results': parseResults(data),
                'total': total
            });
        });
    };

});

module.exports = stampit.compose(abstractController, apiController);