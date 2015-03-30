function init() {
    var cordova_exec_timeout;

    if (cordova.exec) {
        clearTimeout(cordova_exec_timeout);
        cordova.exec(
            function (result) {
                document.querySelector("#shakeDetectionValue").checked = result.allow_shake;
                document.querySelector("#shakeSensitivity").value = String(result.shake_value);
            },
            function (err) {
                console.error(err);
            },
            "AnnoCordovaPlugin",
            "get_shake_settings",
            []
        );
    } else {
        cordova_exec_timeout = setTimeout(init, 50);
    }
}

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

            connect.connect(dom.byId("viewFeedback"), "click", function (e) {
                cordova.exec(
                    function (result) {},
                    function (err) {
                        console.error(err);
                    },
                    "AnnoCordovaPlugin",
                    "goto_anno_home",
                    []
                );
            });

            connect.connect(dom.byId("shakeSensitivity"), "change", function (e) {
                var shake_value = Number(e.currentTarget.value);
                cordova.exec(
                    function (result) {},
                    function (err) {
                        console.error(err);
                    },
                    "AnnoCordovaPlugin",
                    "save_shake_value",
                    [shake_value]
                );
            });
        });
    });
