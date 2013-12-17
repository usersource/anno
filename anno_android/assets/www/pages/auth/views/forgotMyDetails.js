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
        var app = null,
            margin = 30;

        var adjustSize = function()
        {
            var viewPoint = win.getBox();

            domStyle.set('fmdFormContainer', 'width', (viewPoint.w-margin*2)+'px');
        };

        var isInputValidate = function()
        {
            var email = dom.byId('fmtEmail').value;

            if (email.length <=0)
            {
                annoUtil.showMessageDialog("Please enter email.");
                return false;
            }

            if (!/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email))
            {
                annoUtil.showMessageDialog("You must enter an email such as yourname@yourhost.com.");
                return false;
            }

            return true;
        };

        var submitFmt = function()
        {
            var email = dom.byId('fmtEmail').value;

            annoUtil.showLoadingIndicator();
            annoUtil.loadAPI(annoUtil.API.account, function(){
                var registerAPI = gapi.client.account.account.forgot_detail({
                    'user_email':email
                });

                registerAPI.execute(function(resp){
                    if (!resp)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showMessageDialog("Response from server are empty when calling account.forgot_detail api.");
                        return;
                    }

                    if (resp.error)
                    {
                        annoUtil.hideLoadingIndicator();

                        annoUtil.showMessageDialog("An error occurred when calling account.forgot_detail api: "+resp.error.message);
                        return;
                    }

                    annoUtil.showMessageDialog("A temporary password has been sent to the email address you provided. Please follow the instructions in your email.", function(){
                        history.back();
                    });
                    annoUtil.hideLoadingIndicator();
                });
            });
        };

        return {
            // simple view init
            init:function ()
            {
                app = this.app;

                _connectResults.push(connect.connect(dom.byId("btnBackToFmt"), 'click', function(e)
                {
                    history.back();
                }));

                _connectResults.push(connect.connect(dom.byId("fmtEmail"), 'keydown', function(e)
                {
                    if (e.keyCode == 13)
                    {
                        if (isInputValidate())
                        {
                            dom.byId('hiddenBtn').focus();
                            submitFmt();
                        }
                    }
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