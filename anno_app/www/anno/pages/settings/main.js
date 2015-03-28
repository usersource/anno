var wentToMainActivity = false;

        var gotoMainActivity = function ()
        {
            // navigator.app.exitApp();
            cordova.exec(
            	function (result) {},
            	function (err) {},
            	"AnnoCordovaPlugin",
            	"exit_current_activity",
            	[]
            );
        };

        require([
            "dojo/ready",
            "dojo/_base/connect",
            "dojo/dom",
            "dojo/json",
            "dijit/registry",
            "dojo/text!../../scripts/hardware-buttons.json",
            "dojox/mobile/deviceTheme",
            "dojo/parser",
            "dojox/mobile/compat"], function (ready, connect, dom, dojoJson, registry, hardwareButtons)
        {
            hardwareButtons = dojoJson.parse(hardwareButtons);
            console.error(hardwareButtons);

            document.addEventListener("deviceready", function(){
                var model = window.device.model;
                console.error("Device model is "+model);
                if (hardwareButtons[model])
                {
                    dom.byId("divTSDescription").innerHTML = hardwareButtons[model].text;
                }
                else
                {
                    if (hardwareButtons["default"])
                    {
                        dom.byId("divTSDescription").innerHTML = hardwareButtons["default"].text;
                    }
                    else
                    {
                        dom.byId("divTSDescription").innerHTML = "Use your device's screenshot capability";
                    }
                }
            }, false);

            // goto first level page from second level page1
            var gotoFirstLevelPage1 = function()
            {
                registry.byId('page1View').performTransition("homeView", -1, "slide", null, function(){
                    document.removeEventListener("backbutton", gotoFirstLevelPage1, false);
                });
            };

            // goto first level page from second level page1
            var gotoFirstLevelPage2 = function()
            {
                registry.byId('page2View').performTransition("homeView", -1, "slide", null, function(){
                    document.removeEventListener("backbutton", gotoFirstLevelPage2, false);
                });
            };

            ready(function ()
            {
                connect.connect(dom.byId("closeMark"), "click", function (e)
                {
                    gotoMainActivity();
                });

                connect.connect(dom.byId("greenBlockTS"), "click", function (e)
                {
                    registry.byId('homeView').performTransition("page1View", 1, "slide", null, function(){
                        document.addEventListener("backbutton", gotoFirstLevelPage1, false);
                    });
                });

                connect.connect(dom.byId("greenBlockAS"), "click", function (e)
                {
                    registry.byId('homeView').performTransition("page2View", 1, "slide", null, function(){
                        document.addEventListener("backbutton", gotoFirstLevelPage2, false);
                    });
                });

                connect.connect(dom.byId("btnGotItHome"), "click", function (e)
                {
                    gotoMainActivity();
                });

                connect.connect(dom.byId("btnGotItPage1"), "click", gotoFirstLevelPage1);

                connect.connect(dom.byId("btnGotItPage2"), "click", gotoFirstLevelPage2);
            });
        });
