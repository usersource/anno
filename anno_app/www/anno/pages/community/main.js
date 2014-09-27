require([
    "dojo/_base/declare",
    "dojo/dom",
    "dijit/registry",
    "dojo/dom-class",
    "dojox/app/main",
    "dojox/json/ref",
    "dojox/mobile/_ContentPaneMixin",
    "anno/common/DBUtil",
    "anno/common/Util",
    "anno/anno/AnnoDataHandler",
    "dojo/text!./app.json",
    "dojo/sniff"],
    function (declare, dom, registry, domClass, Application, jsonRef, _ContentPaneMixin, DBUtil, annoUtil, annoDataHandler, config, has)
    {
        var config = jsonRef.fromJson(config);
        // console.error("Worked!");

        // if user clicked back button
        config._backwardFired = false;
        config.isBackwardFired = function()
        {
            if (this._backwardFired)
            {
                this._backwardFired = false;
                return true;
            }

            return false;
        };

        config.setBackwardFired = function(fired)
        {
            this._backwardFired = fired;
            // console.log("setBackwardFired: "+ this._backwardFired);
        };

        document.addEventListener("pause", function() {
            window.clearTimeout(annoUtil.startBackgroundSyncTimer);
        });

        document.addEventListener("resume", function() {
            annoDataHandler.startBackgroundSync();
        });

        document.addEventListener("deviceready", function(){
            DBUtil.initDB(function(){
                console.log("[community:main.js] DB is ready.");
                annoUtil.readSettings(function(){
                    Application(config);
                });
            });
        }, false);
    });
