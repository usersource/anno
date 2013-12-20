require([
    "dojo/_base/declare",
    "dojo/dom",
    "dijit/registry",
    "dojo/dom-class",
    "dojox/app/main",
    "dojox/json/ref",
    "dojox/mobile/_ContentPaneMixin",
    "dojo/text!./app.json"
],
    function (declare, dom, registry, domClass, Application, jsonRef, _ContentPaneMixin, config)
    {
        var config = jsonRef.fromJson(config);
        console.log("Worked!");

        Application(config);
    });
