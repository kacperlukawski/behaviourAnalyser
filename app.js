var configuration = require('./configuration'); // git://github.com/joewhite86/node-neo4j-embedded.git#neo4j-2.x
var logger = require('./helpers/logger')
var neo4j = new require('neo4j-embedded');
var express = require('express');
var jade = require('jade');
var fs = require('fs');

neo4j.setDatabaseProperties(configuration.databaseProperties);
neo4j.setVMOptions(configuration.VM);

try {
    neo4j.connect(configuration.databaseName, function(err, database) {
        if (err) {
            throw err;
        }
        
        logger.info('Neo4j has started');
        
        var app = express();
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.use(express.static(__dirname + '/public'));

        fs.readdirSync('./controllers').forEach(function(file) {
            if ('.js' === file.substr(-3)) {
                var controller = require('./controllers/' + file)();
                controller.setDatabase(database);
                controller.setRoutes(app);
            }
        });

        app.listen(3000);
        
        logger.info('API has started');
    });
} catch (ex) {
    console.error(ex);
}
