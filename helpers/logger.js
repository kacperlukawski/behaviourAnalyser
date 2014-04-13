var stampit = require('stampit');

module.exports = global.logger = stampit().enclose(function() {
    this.info = function(msg) {
        console.log(msg);
    };
})();