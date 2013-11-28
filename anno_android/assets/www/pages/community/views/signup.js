define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/_base/connect",
    "dojo/window",
    "dijit/registry"
],
    function (dom, domClass, domStyle, connect, win, registry)
    {
        var _connectResults = []; // events connect results
        var app = null,
            margin = 30;

        var adjustSize = function()
        {
            var viewPoint = win.getBox();

            domStyle.set('signupFormContainer', 'width', (viewPoint.w-margin*2)+'px');
        };

        return {
            // simple view init
            init:function ()
            {
                app = this.app;

                _connectResults.push(connect.connect(dom.byId("btnBackToSignUp"), 'click', function(e)
                {
                    history.back();
                }));

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