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
    "dojo/text!./app.json"
],
    function (declare, dom, registry, domClass, Application, jsonRef, _ContentPaneMixin, DBUtil, annoUtil, config)
    {
        var config = jsonRef.fromJson(config);
        console.log("Worked!");

        document.addEventListener("deviceready", function(){
            DBUtil.initDB(function(){
                console.error("DB is readay!");
                annoUtil.readSettings(function(){
                    Application(config);
                });
            });
        }, false);

    });
