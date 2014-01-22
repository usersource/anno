define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/_base/connect",
    "dojo/window",
    "dijit/registry",
    "dojox/css3/transit",
    "anno/common/DBUtil",
    "anno/common/Util",
    "anno/common/OAuthUtil",
    "anno/anno/AnnoDataHandler"
],
    function (dom, domClass, domStyle, connect, win, registry, transit, DBUtil, annoUtil, OAuthUtil, AnnoDataHandler)
    {
        var _connectResults = []; // events connect results
        var app = null,
            margin = 10,
            currentSignInUserInfo;

        var _callbackURL = "";
        var _currentAuthResult = null;
        var inAnnoSignInView = false;

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
            var email = dom.byId('signinEmail').value,
                pwd = dom.byId('signPwd').value;

            annoUtil.showLoadingIndicator();
            annoUtil.loadAPI(annoUtil.API.account, function(){
                var signinAPI = gapi.client.account.account.authenticate({
                    'password':pwd,
                    'user_email':email
                });

                signinAPI.execute(function(resp){
                    if (!resp)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showMessageDialog("Response from server are empty when calling account.authenticate api.");
                        return;
                    }

                    if (resp.error)
                    {
                        annoUtil.hideLoadingIndicator();

                        annoUtil.showMessageDialog("An error occurred when calling account.authenticate api: "+resp.error.message);
                        return;
                    }

                    // save user info into local db
                    var userInfo = {};
                    userInfo.userId = resp.result.id;
                    userInfo.email = email;
                    userInfo.password = pwd;
                    userInfo.signinMethod = "anno";
                    userInfo.nickname = resp.result.display_name;

                    AnnoDataHandler.saveUserInfo(userInfo, function(){
                        doCallback();
                    });
                    annoUtil.hideLoadingIndicator();
                });
            });
        };

        var saveNickname = function()
        {
            // save nick name.
            var userInfo = {};
            userInfo.userId = currentSignInUserInfo.id;
            userInfo.email = currentSignInUserInfo.email;
            userInfo.signinMethod = "google";
            userInfo.nickname = dom.byId("nickNameSignin").value;

            annoUtil.showLoadingIndicator();
            annoUtil.loadAPI(annoUtil.API.account, function(){
                var bindAccountAPI = gapi.client.account.account.bind_account({
                    'display_name':dom.byId("nickNameSignin").value,
                    'auth_source':'Google'
                });

                bindAccountAPI.execute(function(resp){
                    if (!resp)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showMessageDialog("Response from server are empty when calling account.bind_account api.");
                        return;
                    }

                    console.error("bind_account:"+JSON.stringify(resp));
                    if (resp.error)
                    {
                        annoUtil.hideLoadingIndicator();

                        annoUtil.showMessageDialog("An error occurred when calling account.bind_account api: "+resp.error.message);
                        return;
                    }

                    AnnoDataHandler.saveUserInfo(userInfo, function(){
                        doCallback(_currentAuthResult);
                    });

                    annoUtil.hideLoadingIndicator();
                });
            });
        };

        var doGoogleAuth = function()
        {
            OAuthUtil.openAuthWindow(authCallback);
            annoUtil.showLoadingIndicator();
        };

        var authCallback = function(result)
        {
            console.error("authCallback invoked.");
            annoUtil.hideLoadingIndicator();
            if (result.success)
            {
                if (!DBUtil.hasUserInLocalDB)
                {
                    annoUtil.showLoadingIndicator();
                    annoUtil.loadAPI(annoUtil.API.user, function(){
                        var getDisplayNameAPI = gapi.client.user.user.displayname.get({});

                        getDisplayNameAPI.execute(function(resp){
                            if (!resp)
                            {
                                annoUtil.hideLoadingIndicator();
                                annoUtil.showMessageDialog("Response from server are empty when calling user.displayname.get api.");
                                return;
                            }

                            if (resp.error)
                            {
                                annoUtil.hideLoadingIndicator();

                                annoUtil.showMessageDialog("An error occurred when calling user.displayname.get api: "+resp.error.message);
                                return;
                            }

                            console.error("user.displayname.get: "+ JSON.stringify(resp));

                            currentSignInUserInfo = result.userInfo;
                            _currentAuthResult = result;
                            if (!resp.display_name)
                            {
                                // goes to pick nick name screen
                                domStyle.set('pickNickNameContainer', 'display', '');
                                domStyle.set('annoSigninContainer', 'display', 'none');
                                domStyle.set('modelApp_signin', 'backgroundColor', '#dddddd');
                                domStyle.set('signinContainer', 'display', 'none');

                                transit(null, dom.byId('pickNickNameContainer'), {
                                    transition:"slide",
                                    duration:300
                                });
                            }
                            else
                            {

                                var userInfo = {};
                                userInfo.userId = currentSignInUserInfo.id;
                                userInfo.email = currentSignInUserInfo.email;
                                userInfo.signinMethod = "google";
                                userInfo.nickname = resp.result.display_name;

                                AnnoDataHandler.saveUserInfo(userInfo, function(){
                                    doCallback(_currentAuthResult);
                                });
                            }

                            annoUtil.hideLoadingIndicator();
                        });
                    });

                }
                else
                {
                    doCallback(result);
                }
            }
            else
            {
                annoUtil.hideLoadingIndicator();
            }
        };

        var doCallback = function(result)
        {
            var cbURL = "";

            if (result&&result.token)
            {
                if (_callbackURL.indexOf("?")>0||_callbackURL.indexOf("#")>0)
                {
                    cbURL = _callbackURL+"&token="+JSON.stringify(result.token);
                }
                else
                {
                    cbURL = _callbackURL+"?token="+JSON.stringify(result.token);
                }
            }
            else
            {
                if (_callbackURL.indexOf("?")>0||_callbackURL.indexOf("#")>0)
                {
                    cbURL = _callbackURL+"&token=9&newuser=0&signinmethod=anno";
                }
                else
                {
                    cbURL = _callbackURL+"?token=9&newuser=0&signinmethod=anno";
                }
            }


            console.error("authCallback url:" + cbURL);
            window.open(cbURL, "_self");
        };

        var goBackToSignin = function()
        {
            domStyle.set('pickNickNameContainer', 'display', 'none');
            domStyle.set('annoSigninContainer', 'display', 'none');
            domStyle.set('modelApp_signin', 'backgroundColor', '#ffffff');
            domStyle.set('signinContainer', 'display', '');
            transit(null, dom.byId('signinContainer'), {
                transition:"slide",
                duration:300,
                reverse: true
            });
        };

        var getUserDisplayName = function()
        {
            var email = dom.byId('signinEmail').value;

            if (email.length <=0) return;

            annoUtil.loadAPI(annoUtil.API.user, function(){
                var getDisplayNameAPI = gapi.client.user.user.displayname.get({email:email});

                getDisplayNameAPI.execute(function(resp){
                    if (!resp)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showMessageDialog("Response from server are empty when calling user.displayname.get api.");
                        return;
                    }

                    if (resp.error)
                    {
                        annoUtil.hideLoadingIndicator();

                        annoUtil.showMessageDialog("An error occurred when calling user.displayname.get api: "+resp.error.message);
                        return;
                    }

                    console.error("user.displayname.get: "+ JSON.stringify(resp));

                    if (resp.display_name)
                    {
                        dom.byId('nickNameSigninAnno').value = resp.display_name;
                    }
                });
            });
        };

        var exitApp = function()
        {
            if (inAnnoSignInView)
            {
                goBackToSignin();
                inAnnoSignInView = false;
            }
            else
            {
                navigator.app.exitApp();
            }
        };

        return {
            // simple view init
            init:function ()
            {
                var params = annoUtil.parseUrlParams(document.location.search);
                _callbackURL = params['callback'];
                console.error("_callbackURL:"+_callbackURL);

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
                    goBackToSignin();
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

                _connectResults.push(connect.connect(dom.byId("signinEmail"), 'blur', function(e)
                {
                    getUserDisplayName();
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

                _connectResults.push(connect.connect(dom.byId("imgGoogle"), 'click', function(e)
                {
                    doGoogleAuth();
                }));

                _connectResults.push(connect.connect(dom.byId("btnSigninWithAnno"), 'click', function(e)
                {
                    domStyle.set('pickNickNameContainer', 'display', 'none');
                    domStyle.set('signinContainer', 'display', 'none');
                    domStyle.set('annoSigninContainer', 'display', '');
                    domStyle.set('signinMessage', 'display', 'none');
                    dom.byId("signinEmail").value = "";
                    dom.byId("signPwd").value = "";
                    dom.byId("nickNameSigninAnno").value = "";
                    domStyle.set('modelApp_signin', 'backgroundColor', '#DDDDDD');

                    transit(null, dom.byId('annoSigninContainer'), {
                        transition:"slide",
                        duration:300
                    });

                    inAnnoSignInView = true;
                }));

                _connectResults.push(connect.connect(dom.byId("btnSubmitAnnoSignin"), 'click', function(e)
                {
                    if (isInputValidate())
                    {
                        dom.byId('hiddenBtn').focus();
                        submitSignIn();
                    }
                }));

                adjustSize();
            },
            afterActivate: function()
            {
                document.addEventListener("backbutton", exitApp, false);
                var gotoSignin = this.params["gotosignin"];

                if (gotoSignin == "1")
                {
                    inAnnoSignInView = true;
                    getUserDisplayName();
                }
            },
            beforeDeactivate: function()
            {
                document.removeEventListener("backbutton", exitApp, false);
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