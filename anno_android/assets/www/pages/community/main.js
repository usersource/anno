require([
    "dojo/_base/declare",
    "dojo/dom",
    "dijit/registry",
    "dojo/dom-class",
    "dojox/app/main",
    "dojox/json/ref",
    "dojox/mobile/_ContentPaneMixin",
    "dojo/text!./app.json",
    "dojo/sniff",
    "./demodata.js"],
    function (declare, dom, registry, domClass, Application, jsonRef, _ContentPaneMixin, config, has)
    {
        var config = jsonRef.fromJson(config);
        console.log("Worked!");

        Application(config);
    });
