define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/_base/connect",
    "dojo/window",
    "dijit/registry",
    "anno/common/Util"
],
    function (dom, domClass, domStyle, connect, win, registry, annoUtil)
    {
        var _connectResults = []; // events connect results
        var app = null;

        var loadLocalAnnos = function()
        {

        };

        var adjustSize = function()
        {
            var viewPoint = win.getBox();

            domStyle.set("listContainerSettings", "height", (viewPoint.h-48)+"px");
        };

        var onServerURLRadioButtonChange = function()
        {
            if (!this.checked) return;

            var self = this;
            annoUtil.saveSettings({item:"ServerURL", value:this.value}, function(success){
                if (success)
                {
                    registry.byId('serverURLDialog').hide();
                    dom.byId('settingValueServerURL').innerHTML = self.labelText;
                }
            });
        };

        return {
            // simple view init
            init:function ()
            {
                app = this.app;
                adjustSize();

                annoUtil.readSettings(function(settings){
                    var serverURLDialog = registry.byId('serverURLDialog');

                    var radioButtons = serverURLDialog.getChildren();
                    for (var i= 0,c=radioButtons.length;i<c;i++)
                    {
                        if (radioButtons[i].value == settings.ServerURL)
                        {
                            radioButtons[i].set('checked', true);
                            dom.byId('settingValueServerURL').innerHTML = radioButtons[i].labelText;
                        }
                    }
                });

                _connectResults.push(connect.connect(registry.byId("settingItemServerUrl"), 'onClick', function(e)
                {
                    var serverURLDialog = registry.byId('serverURLDialog');

                    /*var radioButtons = serverURLDialog.getChildren();
                    var settings = annoUtil.getSettings();
                    for (var i= 0,c=radioButtons.length;i<c;i++)
                    {
                        if (radioButtons[i].value == settings.ServerURL)
                        {
                            radioButtons[i].set('checked', true);
                        }
                    }*/
                    serverURLDialog.show();
                    domStyle.set(serverURLDialog._cover[0], {"height": "100%", top:"0px"});
                }));

                var radioButtons = registry.byId('serverURLDialog').getChildren();

                for (var i= 0,c=radioButtons.length;i<c;i++)
                {
                    radioButtons[i].onChange = onServerURLRadioButtonChange;
                }

                _connectResults.push(connect.connect(dom.byId("btnCancelServerURL"), 'click', function(e)
                {
                    var serverURLDialog = registry.byId('serverURLDialog');
                    serverURLDialog.hide();
                }));
            },
            afterActivate: function()
            {
                loadLocalAnnos();
            },
            beforeDeactivate: function()
            {
                registry.byId('serverURLDialog').hide();
            },
            destroy:function ()
            {
                var connectResult = _connectResults.pop();
                while (connectResult)
                {
                    connect.disconnect(connectResult);
                    connectResult = _connectResults.pop();
                }
            }
        }
    });