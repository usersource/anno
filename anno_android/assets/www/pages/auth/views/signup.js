define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/_base/connect",
    "dojo/window",
    "dijit/registry",
    "anno/common/Util",
    "anno/anno/AnnoDataHandler"
],
    function (dom, domClass, domStyle, connect, win, registry, annoUtil, AnnoDataHandler)
    {
        var _connectResults = []; // events connect results
        var app = null,
            margin = 30;

        var _callbackURL;

        var adjustSize = function()
        {
            var viewPoint = win.getBox();

            domStyle.set('signupFormContainer', 'width', (viewPoint.w-margin*2)+'px');
        };

        var isInputValidate = function()
        {
            var email = dom.byId('signupEmail').value,
                pwd = dom.byId('signupPwd').value,
                nickname = dom.byId('nickNameSignup').value;

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

            if (pwd.length < 6)
            {
                annoUtil.showMessageDialog("Password must be at least 6 characters long.");
                return false;
            }

            if (nickname.length < 0)
            {
                annoUtil.showMessageDialog("Please enter nickname.");
                return false;
            }

            return true;
        };

        var submitSignUp = function()
        {
            var email = dom.byId('signupEmail').value,
                pwd = dom.byId('signupPwd').value,
                nickname = dom.byId('nickNameSignup').value;

            var registerAPI = gapi.client.account.account.register({
                'display_name':nickname,
                'password':pwd,
                'user_email':email
            });

            annoUtil.showLoadingIndicator();
            registerAPI.execute(function(resp){
                if (!resp)
                {
                    annoUtil.hideLoadingIndicator();
                    annoUtil.showMessageDialog("Response from server are empty when calling account.register api.");
                    return;
                }

                if (resp.error)
                {
                    annoUtil.hideLoadingIndicator();

                    annoUtil.showMessageDialog("An error occurred when calling account.register api: "+resp.error.message);
                    return;
                }

                // save user info into local db
                var userInfo = {};
                userInfo.userId = resp.result.id;
                userInfo.email = email;
                userInfo.password = pwd;
                userInfo.signinMethod = "anno";
                userInfo.nickname = nickname;

                AnnoDataHandler.saveUserInfo(userInfo, function(){
                    doCallback();
                });
                annoUtil.hideLoadingIndicator();
            });
        };

        var doCallback = function()
        {
            var cbURL = "";

            if (_callbackURL.indexOf("?")>0||_callbackURL.indexOf("#")>0)
            {
                cbURL = _callbackURL+"&token=9&newuser=1&signinmethod=anno";
            }
            else
            {
                cbURL = _callbackURL+"?token=9&newuser=1&signinmethod=anno";
            }

            console.error("authCallback url:" + cbURL);
            window.open(cbURL, "_self");
        };

        return {
            // simple view init
            init:function ()
            {
                var params = annoUtil.parseUrlParams(document.location.search);
                _callbackURL = params['callback'];

                console.error("_callbackURL:"+_callbackURL);

                app = this.app;

                _connectResults.push(connect.connect(dom.byId("btnBackToSignUp"), 'click', function(e)
                {
                    history.back();
                }));

                _connectResults.push(connect.connect(dom.byId("signupEmail"), 'keydown', function(e)
                {
                    if (e.keyCode == 13)
                    {
                        dom.byId("signupPwd").focus();
                        dom.byId("signupPwd").click();

                        annoUtil.showSoftKeyboard();
                    }
                }));

                _connectResults.push(connect.connect(dom.byId("signupPwd"), 'keydown', function(e)
                {
                    if (e.keyCode == 13)
                    {
                        dom.byId("nickNameSignup").focus();
                        dom.byId("nickNameSignup").click();

                        annoUtil.showSoftKeyboard();
                    }
                }));

                _connectResults.push(connect.connect(dom.byId("nickNameSignup"), 'keydown', function(e)
                {
                    if (e.keyCode == 13)
                    {
                        if (isInputValidate())
                        {
                            dom.byId('hiddenBtn').focus();
                            submitSignUp();
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