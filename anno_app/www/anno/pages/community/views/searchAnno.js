define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/_base/connect",
    "dojo/window",
    "dijit/registry",
    "anno/common/Util",
    "anno/common/OAuthUtil",
    "anno/anno/AnnoDataHandler"
],
    function (dom, domClass, domStyle, connect, win, registry, annoUtil, OAuthUtil, AnnoDataHandler)
    {
        var _connectResults = []; // events connect results
        var app = null;

        var adjustSize = function()
        {
        };

        return {
            // simple view init
            init:function ()
            {
                app = this.app;
                adjustSize();
            },
            afterActivate: function()
            {
            },
            beforeDeactivate: function()
            {
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