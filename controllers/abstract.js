var stampit = require('stampit');

module.exports = stampit().enclose(function(){
    var database = null;
    var indexManager = null;

    /**
     * Sets routes for the controller
     * @param {express} app
     */
    this.setRoutes = function(app) {};

    /**
     * Sets the database connection
     * @param {neo4j} _database
     */
    this.setDatabase = function(_database) {};
});