(function(window) {
    window.ba = {
        version: '0.5.1',
        cookieName: '_bas',
        trackingUrl: '//localhost:3000/track',
        /**
         * Track an event of given type and parameters
         * @param {String} eventType
         * @param {Object} parameters
         */
        trackEvent: function(eventType, parameters) {
            if (!parameters) {
                parameters = {};
            }

            parameters._e = eventType;
            parameters._s = this.getSessionId();

            var img = document.createElement('img');
            img.setAttribute('src', this.createTrackingUrl(parameters));
            document.appendChild(img);
        },
        /**
         * Create an URL with given parameters
         * @param {Object} parameters
         * @returns {String}
         */
        createTrackingUrl: function(parameters) {
            var trackingUrl = this.trackingUrl + '?';
            for (var key in parameters) {
                trackingUrl = trackingUrl + key + '=' + encodeURIComponent(parameters[key]) + '&';
            }

            return trackingUrl;
        },
        /**
         * Read identifier of the session
         * @returns {undefined|String}
         */
        getSessionId: function(){
            return this.getCookie(this.cookieName) || this.setCookie(this.cookieName, this.generateUniqId(), 1);
        },
        /**
         * Set the value of the cookie
         * @param {String} cname
         * @param {String} cvalue
         * @param {Integer} exdays
         * @returns {String}
         */
        setCookie: function(cname, cvalue, exdays) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            var expires = "expires=" + d.toGMTString();
            document.cookie = cname + "=" + cvalue + "; " + expires;
            return cvalue;
        },
        /**
         * Get the value of the cookie
         * @param {String} cname
         * @returns {undefined|String}
         */
        getCookie: function(cname) {
            var name = cname + '=';
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i].trim();
                if (c.indexOf(name) === 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return undefined;
        },
        /**
         * Generate unique identifier of current visitor
         * @returns {String}
         */
        generateUniqId: function(){
            return (Math.random().toString(16) + (new Date().getTime()).toString(16)).substring(2);
        }
    };
})(window || this);