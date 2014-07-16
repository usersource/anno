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
    "dojo/text!./app.json",
    "dojo/sniff"],
    function (declare, dom, registry, domClass, Application, jsonRef, _ContentPaneMixin, DBUtil, annoUtil, config, has)
    {
        var config = jsonRef.fromJson(config);
        console.error("Worked!");

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
            console.log("setBackwardFired: "+ this._backwardFired);
        };

        document.addEventListener("deviceready", function(){
            DBUtil.initDB(function(){
                console.error("DB is readay!");
                annoUtil.readSettings(function(){
                    Application(config);
                });
            });
        }, false);
    });
