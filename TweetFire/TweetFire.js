/**
 * A jQuery plugin to easily gather data from the Twitter API for a given user.
 */

(function($) {

    /**
     * The default settings for the user to gather information about
     */
    var settings = {
        screen_name: "twitterapi",
        user_id: null,
        since_id: null,
        count: 5,
        trim_user: true,
        include_rts: true
    };

    var baseApiUrl = "http://api.twitter.com/1/";

    var getAjaxData = function() {
        var data = {};
        $.each(settings, function(index, value) {
            if (value == null) {
                return;
            }
            data[index] = encodeURIComponent(value);
        });
        return data;
    };


    /**
     * The various methods that may be invoked
     */
    var actions = {
        /**
         * @param options object Should have key/value pairs as described in module-level docs
         * @return object Settings TweetFire will use to query the data
         */
        initialize: function(options) {
            if (typeof options != "object") {
                options = {};
            }
            return settings = $.extend(settings, options);
        },
        timeline: function(callback) {
            if (!$.isFunction(callback)) {
                throw "A function for success callback must be passed as the second parameter when retrieving a timeline."
            }

            var url = baseApiUrl + "statuses/user_timeline.json";
            var errorCallback = function(jqHr, status, error) {
                console.log(error);
            };

            var ajaxData = getAjaxData();

            var ajaxOptions = {
                url: url,
                data: ajaxData,
                dataType: "jsonp",
                contentType: "application/json",
                scriptCharset: "utf-8",
                crossDomain: true,
                error: errorCallback,
                success: callback
            };

            $.ajax(ajaxOptions);
        }
    };

    $.fn.TweetFire = function(action) {

        if (actions[action] && action != "initialize") {
            var numArgs = arguments.length;
            var callback = [];
            callback[0] = null;
            if (numArgs == 2) {
                callback[0] = arguments[1];
            }
            actions[action].apply(this, callback);
        }

        if (typeof action === "object" || !action) {
            return actions.initialize.apply(this, arguments);
        }

        return {
            errors:
            [
                {
                    message: "The action, " + action + ", is not supported by TweetFire.",
                    code: 1
                }
            ]

        };

    };

}(jQuery));
