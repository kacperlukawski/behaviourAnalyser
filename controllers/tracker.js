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
        app.get('/track', this.track);
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
     * Tracks HTTP requests and saves them in a queue
     * @param {request} req
     * @param {response} res
     */
    this.track = function(req, res) {
        if (req.query._e && req.query._s) {
            var session = req.query._s;

            delete req.query._s;
            if (req.query[''] !== undefined) {
                delete req.query[''];
            }

            sessionsContainer.addSessionEvent(session, req.query);
        }

        res.set('Content-type', 'image/png');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '-1');
        res.end('');
    };

    /**
     * Stores events from the queue in a database
     */
    this.storeEvents = function() {
        var oldSessions = sessionsContainer.getOldSessions(1000 * 60);
        for (var sessionIdx in oldSessions) {
            var session = oldSessions[sessionIdx];
            var sessionEvents = sessionsContainer.getSessionEvents(session);

            sessionsContainer.removeSessionEvents(session);

            var transaction = database.beginTx();
            for (var sessionEventIdx in sessionEvents) {
                var event = sessionEvents[sessionEventIdx];
                var lastSessionEvent = sessionsContainer.getLastSessionEvent(session);

                var lastEventNode = database.getOrCreate('nodes', '_id', lastSessionEvent._id);
                lastEventNode.setProperties(lastSessionEvent);

                var eventNode = database.getOrCreate('nodes', '_id', event._id);
                eventNode.setProperties(event);

                if (lastEventNode.getId() === eventNode.getId()) {
                    // there we should deal with self-relationship
                    // we need additonal node, that will keep the information
                    // about cycle - there should be one additional node for
                    // each node (detour node) that has cyclic relationship
                    var detourNodeProperties = _getDetourNodeProperties(eventNode.getProperties());
                    var detourNode = database.getOrCreate('nodes', '_id', detourNodeProperties._id);
                    detourNode.setProperties(detourNodeProperties);

                    var nodeToDetourRelationship = _getRelationshipBetweenNodes(eventNode, detourNode);
                    var detourToNodeRelationship = _getRelationshipBetweenNodes(detourNode, eventNode);

                    nodeToDetourRelationship.setProperty('count', parseInt(nodeToDetourRelationship.getProperty('count', 0)) + 1);
                    detourToNodeRelationship.setProperty('count', 0);

                    logger.info('cyclicRelationship', eventNode.getId(), detourNode.getId(), eventNode.getId());
                } else {
                    var lastToCurrentEventRelationship = _getRelationshipBetweenNodes(lastEventNode, eventNode);
                    lastToCurrentEventRelationship.setProperty('count', parseInt(lastToCurrentEventRelationship.getProperty('count', 0)) + 1);

                    logger.info('relationship', lastEventNode.getId(), eventNode.getId());
                }

                sessionsContainer.setLastSessionEvent(session, event);
            }
            transaction.success();
            transaction.finish();
        }

        _refreshProbabilities();
    };

    setInterval(this.storeEvents, 60000);

    /**
     * Generate properties for detour node
     * @param {Object} properties
     * @returns {Object}
     */
    var _getDetourNodeProperties = function(properties) {
        var parentNodeId = properties._id;
        delete properties._id;

        properties._e = properties._e + '-detour';
        properties._detour = true;
        properties._parent = parentNodeId;
        properties._id = sessionsContainer.objectID(properties);

        return properties;
    };

    /**
     * Gets the relationship between selected nodes
     * @param {Object} startNode
     * @param {Object} endNode
     * @returns {Object}
     */
    var _getRelationshipBetweenNodes = function(startNode, endNode) {
        var connectingRelationship = null;
        var startEventRelationships = startNode.getRelationships('PRECEDES');
        for (var relationshipIdx = 0; relationshipIdx < startEventRelationships.length; relationshipIdx++) {
            if (endNode.getId() === startEventRelationships[relationshipIdx].getEndNode().getId()) {
                connectingRelationship = startEventRelationships[relationshipIdx];
                break;
            }
        }
        if (null === connectingRelationship) {
            connectingRelationship = startNode.createRelationshipTo(endNode, 'PRECEDES', {
                'count': 0
            });
        }

        return connectingRelationship;
    };

    /**
     * Updates the probabilities of going from one point to another
     */
    var _refreshProbabilities = function() {
        var query = database.queryBuilder();
        query.startAt({
            'event': 'node(*)'
        });
        query.returns('event');
        query.execute({}, function(error, data, total) {
            data.forEach(function(event) {
                event = event['event'].getProperties();
                if (event._id) {
                    var transaction = database.beginTx();

                    var countSum = 0;
                    var eventNode = database.getOrCreate('nodes', '_id', event._id);
                    var eventNodeRelationships = eventNode.getRelationships();
                    for (var i in eventNodeRelationships) {
                        var relationship = eventNodeRelationships[i];
                        if (typeof relationship === 'object') {
                            if (relationship.getStartNode().getId() === eventNode.getId()) {
                                countSum = countSum + parseInt(relationship.getProperty('count', 0));
                            }
                        }
                    }

                    for (var i in eventNodeRelationships) {
                        var relationship = eventNodeRelationships[i];
                        if (typeof relationship === 'object') {
                            if (relationship.getStartNode().getId() === eventNode.getId()) {
                                var probability = 1;
                                if (countSum > 0) {
                                    probability = parseInt(relationship.getProperty('count', 0)) / countSum;
                                }

                                relationship.setProperty('probability', probability);
                                relationship.setProperty('inversedProbability', 1 - probability);
                            }
                        }
                    }

                    transaction.success();
                    transaction.finish();
                }
            });
        });
    };
});