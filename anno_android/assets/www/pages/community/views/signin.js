define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/_base/connect",
    "dojo/window",
    "dijit/registry",
    "dojox/css3/transit",
    "anno/common/Util"
],
    function (dom, domClass, domStyle, connect, win, registry, transit, annoUtil)
    {
        var _connectResults = []; // events connect results
        var app = null,
            margin = 30;

        var adjustSize = function()
        {
            var viewPoint = win.getBox();

            domStyle.set('signinFormContainer', 'width', (viewPoint.w-margin*2)+'px');
            domStyle.set('pickNickNameContainer', 'width', (viewPoint.w-margin*2)+'px');
        };

        var isInputValidate = function()
        {
            var email = dom.byId('signinEmail').value,
                pwd = dom.byId('signPwd').value;

            if (email.length <=0)
            {
                annoUtil.showMessageDialog("Please enter email.");
                return false;
            }

            if (!/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email))
            {
                annoUtil.showMessageDialog("you must enter an email such as yourname@yourhost.com.");
                return false;
            }

            if (pwd.length <=0)
            {
                annoUtil.showMessageDialog("Please enter password.");
                return false;
            }

            return true;
        };

        var submitSignIn = function()
        {
            domStyle.set('pickNickNameContainer', 'display', '');
            domStyle.set('signinContainer', 'display', 'none');

            transit(null, dom.byId('pickNickNameContainer'), {
                transition:"slide",
                duration:300
            });
        };

        var saveNickname = function()
        {

        };

        return {
            // simple view init
            init:function ()
            {
                app = this.app;

                _connectResults.push(connect.connect(dom.byId("btnSignUp"), 'click', function(e)
                {
                    app.transitionToView(document.getElementById('modelApp_signin'), {target:'signup',url:'#signup'});
                }));

                _connectResults.push(connect.connect(dom.byId("btnFmd"), 'click', function(e)
                {
                    app.transitionToView(document.getElementById('modelApp_signin'), {target:'forgotMyDetails',url:'#forgotMyDetails'});
                }));

                _connectResults.push(connect.connect(dom.byId("btnBackToSignin"), 'click', function(e)
                {
                    domStyle.set('pickNickNameContainer', 'display', 'none');
                    domStyle.set('signinContainer', 'display', '');
                    transit(null, dom.byId('signinContainer'), {
                        transition:"slide",
                        duration:300,
                        reverse: true
                    });
                }));

                _connectResults.push(connect.connect(dom.byId("signinEmail"), 'keydown', function(e)
                {
                    if (e.keyCode == 13)
                    {
                        dom.byId("signPwd").focus();
                        dom.byId("signPwd").click();

                        annoUtil.showSoftKeyboard();
                    }
                }));

                _connectResults.push(connect.connect(dom.byId("signPwd"), 'keydown', function(e)
                {
                    if (e.keyCode == 13)
                    {
                        if (isInputValidate())
                        {
                            dom.byId('hiddenBtn').focus();
                            submitSignIn();
                        }
                    }
                }));

                _connectResults.push(connect.connect(dom.byId("nickNameSignin"), 'keydown', function(e)
                {
                    if (e.keyCode == 13)
                    {
                        if (dom.byId("nickNameSignin").value.length <= 0)
                        {
                            annoUtil.showMessageDialog("Please enter Nickname.");
                        }
                        else
                        {
                            saveNickname();
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