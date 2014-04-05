var stampit = require('stampit');
var crypto = require('crypto');

module.exports = stampit().enclose(function() {
    var sessionEvents = {};
    var sessionLastEvent = {};
    var sessionLastEventTime = {};
    var defaultLastEvent = {
        '_e': 'sessionStart'
    };

    /**
     * Adds event to the session
     * @param {String} session
     * @param {Object} event
     */
    this.addSessionEvent = function(session, event) {
        event._id = this.objectID(event);

        if (!sessionEvents[session]) {
            sessionEvents[session] = [];
            sessionLastEventTime[session] = 0;
        }

        sessionEvents[session].push(event);
        sessionLastEventTime[session] = (new Date()).getTime();
    };

    /**
     * Gets all events that were added to the session, but haven't been saved yet
     * @param {String} session
     * @returns {_L3.sessionEvents|Array}
     */
    this.getSessionEvents = function(session) {
        if (!sessionEvents[session]) {
            return [];
        }

        return sessionEvents[session];
    };

    this.setLastSessionEvent = function(session, event) {
        sessionLastEvent[session] = event;
    };

    this.getLastSessionEvent = function(session) {
        if (!sessionLastEvent[session]) {
            return defaultLastEvent;
        }

        return sessionLastEvent[session];
    };

    /**
     * Removes all events for selected session
     * @param {type} session
     * @returns {undefined}
     */
    this.removeSessionEvents = function(session) {
        if (sessionEvents[session]) {
            sessionEvents[session] = [];
        }
    };

    /**
     * Gets IDs of old sessions (ended ones)
     * @param {Microseconds} difference
     * @returns {Array}
     */
    this.getOldSessions = function(difference) {
        var oldSessions = [];
        var currentTimestamp = (new Date()).getTime();
        for (var session in sessionLastEventTime) {
            if (currentTimestamp > sessionLastEventTime[session] + difference) {
                oldSessions.push(session);
            }
        }

        return oldSessions;
    };

    /**
     * Counts the ID of object based on inner fields
     * @param {Object} object
     * @returns {_L3.objectID.id}
     */
    this.objectID = function(object) {
        var innerFields = [];
        for (var key in object) {
            innerFields.push(key + '|' + object[key]);
        }
        innerFields.sort();

        var id = typeof object + innerFields.join('.');
        var shasum = crypto.createHash('sha1');
        shasum.update(id);
        return shasum.digest('hex');
    };

    defaultLastEvent._id = this.objectID(defaultLastEvent);
});