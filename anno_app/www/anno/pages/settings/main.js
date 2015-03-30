require([
    "dojo/ready",
    "dojo/_base/connect",
    "dojo/dom",
    "dojo/json",
    "dijit/registry",
    "dojox/mobile/deviceTheme",
    "dojo/parser",
    "dojox/mobile/compat"], function (ready, connect, dom, dojoJson, registry) {
        ready(function () {
            connect.connect(dom.byId("imgBackOuter"), "click", function (e) {
                cordova.exec(
                    function (result) {},
                    function (err) {},
                    "AnnoCordovaPlugin",
                    "exit_current_activity",
                    []
                );
            });
        });
    });
