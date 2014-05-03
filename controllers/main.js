var stampit = require('stampit');
var abstractController = require('./abstract');

var mainController = stampit().enclose(function() {
    var database = null;
    var indexManager = null;

    /**
     * Sets routes for the controller
     * @param {express} app
     */
    this.setRoutes = function(app) {
        app.get('/', this.main);
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
    
    this.main = function(req, res) {
        res.render('layout', {});
    };
});

module.exports = stampit.compose(abstractController, mainController);