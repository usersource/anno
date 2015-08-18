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
    "anno/anno/AnnoDataHandler",
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
        var logoClickCnt = 0;

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
            var select = dom.byId('select');
            var selected_Team_Key;
            if(select){
                selected_Team_Key = select.options[select.selectedIndex].value;
            }else{
                selected_Team_Key = '';
            }
            
            var APIConfig = {
                name: annoUtil.API.account,
                method: "account.account.authenticate",
                parameter: {
                    'password':pwd,
                    'user_email':email,
                    'team_key' : selected_Team_Key 
                },
                success: function(resp)
                {
                    // save user info into local db
                    console.log(' response : ', resp);
                    var userInfo = {};
                    userInfo.userId = resp.result.id;
                    userInfo.email = email;
                    userInfo.password = pwd;
                    userInfo.signinMethod = "anno";
                    userInfo.nickname = resp.result.display_name;

                    AnnoDataHandler.saveUserInfo(userInfo, function(){
                        doCallback();
                    });
                },
                error: function(){
                }
            };

            annoUtil.callGAEAPI(APIConfig);
        };

        var saveNickname = function()
        {
            var nickName = dom.byId("nickNameSignin").value;

            if (nickName.length <= 0) {
                annoUtil.showMessageDialog("Please enter Nickname.");
                return;
            }

            // save nick name.
            var userInfo = {};
            userInfo.userId = currentSignInUserInfo.id;
            userInfo.email = currentSignInUserInfo.email;
            userInfo.signinMethod = "google";
            userInfo.nickname = nickName;

            var APIConfig = {
                name: annoUtil.API.account,
                method: "account.account.bind_account",
                parameter: {
                    'display_name':nickName,
                    'auth_source':'Google',
                    'user_email':currentSignInUserInfo.email
                },
                success: function(data){
                    console.log("bind_account:" + JSON.stringify(data));
                    AnnoDataHandler.saveUserInfo(userInfo, function(){
                        _currentAuthResult.newUser = true;
                        doCallback(_currentAuthResult);
                    });
                },
                error: function(){
                }
            };

            annoUtil.callGAEAPI(APIConfig);
        };

        var doGoogleAuth = function()
        {
            // OAuthUtil.openAuthWindow(authCallback);
            window.plugins.googleplus.login({
                'iOSApiKey': annoUtil.getiOSClientID()
            }, function (result) {
                result["success"] = true;
                result["userInfo"] = { "id" : result.userId, "email" : result.email };
                authCallback(result);
            }, function (error) {
                annoUtil.showToastDialog("Something went wrong while authenticating with Google");
                annoUtil.hideLoadingIndicator();
                console.error('error:', error);
            });

            annoUtil.showLoadingIndicator();
        };

        var doFacebookAuth = function() {
            facebookConnectPlugin.login([
                "public_profile", "email"
            ], function (result) {
                var user_email;
                facebookConnectPlugin.api("me?fields=email", [], function(data) {
                    user_email = data.email;
                    result["success"] = true;
                    result["email"] = user_email;
                    result["oauthToken"] = result.authResponse.accessToken;
                    result["userInfo"] = { "id" : result.authResponse.userID, "email" : result.email };
                    authCallback(result);
                });
            }, function (error) {
                if (error.errorCode !== "4201") {
                    annoUtil.showToastDialog("Something went wrong while authenticating with Facebook");
                }
                annoUtil.hideLoadingIndicator();
                console.error('error:', error);
            });

            annoUtil.showLoadingIndicator();
        };

        var authCallback = function(result)
        {
            console.log("authCallback invoked.");
            annoUtil.hideLoadingIndicator();
            if (result.success)
            {
                if (!DBUtil.hasUserInLocalDB)
                {
                    var APIConfig = {
                        name: annoUtil.API.user,
                        method: "user.user.displayname.get",
                        parameter: {email: result.email},
                        success: function(data)
                        {
                            console.log("user.displayname.get: "+ JSON.stringify(data));

                            currentSignInUserInfo = result.userInfo;
                            _currentAuthResult = result;
                            if (!data.display_name) {
                                // goes to pick nick name screen
                                domStyle.set('pickNickNameContainer', 'display', '');
                                domStyle.set('annoSigninContainer', 'display', 'none');
                                domStyle.set('modelApp_signin', 'backgroundColor', '#dddddd');
                                domStyle.set('signinContainer', 'display', 'none');

                                transit(null, dom.byId('pickNickNameContainer'), {
                                    transition:"slide",
                                    duration:300
                                });
                            } else {
                                var userInfo = {};
                                userInfo.userId = currentSignInUserInfo.id;
                                userInfo.email = currentSignInUserInfo.email;
                                userInfo.signinMethod = "google";
                                userInfo.nickname = data.result.display_name;

                                AnnoDataHandler.saveUserInfo(userInfo, function(){
                                    doCallback(_currentAuthResult);
                                });
                            }
                        },
                        error: function(){
                        }
                    };

                    annoUtil.callGAEAPI(APIConfig);
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

            if (result && result.oauthToken)
            {
                if (_callbackURL.indexOf("?")>0||_callbackURL.indexOf("#")>0)
                {
                    cbURL = _callbackURL+"&token=" + result.oauthToken;
                }
                else
                {
                    cbURL = _callbackURL+"?token=" + result.oauthToken;
                }

                if (result.newUser)
                {
                    cbURL = cbURL + "&newuser=1";
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


            console.log("authCallback url:" + cbURL);
            window.open(cbURL, "_self");
        };

        var getAllTeams = function()
        {
            var email = dom.byId('signinEmailId').value;
            dom.byId("signinEmail").value = email;
            console.log('email' ,email);
            if (email.length <=0) return;

            var APIConfig = {
                name: annoUtil.API.account,
                method: "account.account.dashboard.teams",
                parameter: {"user_email":email},
                showLoadingSpinner: false,
                success: function(resp)
                {   
                    if (resp.account_info.length > 0)
                        AddTeamOptions(resp.account_info);
                },
                error: function(){
                  console.log(" error ");  
                }
            };

            annoUtil.callGAEAPI(APIConfig);
        };

        var AddTeamOptions = function(teams){
            domStyle.set('select', 'display', '');
            var select = dom.byId('select');
            for (var i = 0; i < teams.length; i++) {
                select.options[select.options.length] = new Option(teams[i].team_name, teams[i].team_key);
            }           
        };  

        var ClearTeamOptions = function(){
            var select = dom.byId('select');
            console.log('no of options :', select.length);
            var length = select.length;
            // for (var i = 0; i < length; i++) {
            //     select.remove(i);
            // };
            while(select.options.length > 0){
                select.remove(0);
            }
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

            var APIConfig = {
                name: annoUtil.API.user,
                method: "user.user.displayname.get",
                parameter: {email:email},
                showLoadingSpinner: false,
                success: function(resp)
                {
                    // console.log("user.displayname.get: " + JSON.stringify(resp));

                    if (resp.display_name)
                    {
                        dom.byId('nickNameSigninAnno').value = resp.display_name;
                    }
                },
                error: function(){
                }
            };

            annoUtil.callGAEAPI(APIConfig);
        };

        var exitApp = function()
        {
            var serverURLDialog = registry.byId('serverURLDialog');
            if (serverURLDialog.domNode.style.display == ""||serverURLDialog.domNode.style.display == "block")
            {
                closeServerURLDialog();
            }
            else if (inAnnoSignInView)
            {
                goBackToSignin();
                inAnnoSignInView = false;
            }
            else
            {
                navigator.app.exitApp();
            }
        };

        var initServerUrlRadioButtons = function()
        {
            var serverURLConfig = annoUtil.API.config, configItem, configItemNode;

            for (var p in serverURLConfig)
            {
                configItem = serverURLConfig[p];
                configItemNode = dom.byId("divServerUrl"+configItem["serverId"]);

                if (configItemNode)
                {
                    domStyle.set(configItemNode, "display", "");
                    configItemNode.children[0].innerHTML = configItem.serverName;
                    registry.byId("rdSU"+configItem["serverId"]).set({"labelText": configItem.serverName, value:p});
                }
            }
        };

        var onServerURLRadioButtonChange = function(value)
        {
            if (!this.checked) return;

            annoUtil.saveSettings({item:"ServerURL", value:this.value}, function(success){
                closeServerURLDialog();
            });
        };

        var openServerURLDialog = function()
        {
            var serverURLDialog = registry.byId('serverURLDialog');

            serverURLDialog.show();
            domStyle.set(serverURLDialog._cover[0], {"height": "100%", top:"0px"});
        };

        var closeServerURLDialog = function()
        {
            var serverURLDialog = registry.byId('serverURLDialog');
            serverURLDialog.hide();
        };

        return {
            // simple view init
            init:function ()
            {
                var params = annoUtil.parseUrlParams(document.location.search);
                _callbackURL = params['callback'];
                console.log("_callbackURL:"+_callbackURL);

                initServerUrlRadioButtons();

                annoUtil.readSettings(function(settings){
                    var serverURLDialog = registry.byId('serverURLDialog');

                    var radioButtons = serverURLDialog.getChildren();
                    for (var i= 0,c=radioButtons.length;i<c;i++)
                    {
                        if (radioButtons[i].value == settings.ServerURL)
                        {
                            radioButtons[i].set('checked', true, false);
                        }
                    }

                    for (var i= 0,c=radioButtons.length;i<c;i++)
                    {
                        radioButtons[i].onChange = onServerURLRadioButtonChange;
                    }
                });

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
                        saveNickname();
                    }
                }));

                _connectResults.push(connect.connect(dom.byId("saveNickNameSignIn"), 'click', function(e)
                {
                    saveNickname();
                }));

                _connectResults.push(connect.connect(dom.byId("imgGoogle"), 'click', function(e)
                {
                    doGoogleAuth();
                }));

                _connectResults.push(connect.connect(dom.byId("imgFacebook"), 'click', function(e) {
                    doFacebookAuth();
                 }));

                // _connectResults.push(connect.connect(dom.byId("btnSigninWithAnno"), 'click', function(e)
                // {
                //     domStyle.set('pickNickNameContainer', 'display', 'none');
                //     domStyle.set('signinContainer', 'display', 'none');
                //     domStyle.set('annoSigninContainer', 'display', '');
                //     domStyle.set('signinMessage', 'display', 'none');
                //     dom.byId("signinEmail").value = "";
                //     dom.byId("signPwd").value = "";
                //     dom.byId("nickNameSigninAnno").value = "";
                //     domStyle.set('modelApp_signin', 'backgroundColor', '#DDDDDD');

                //     transit(null, dom.byId('annoSigninContainer'), {
                //         transition:"slide",
                //         duration:300
                //     });

                //     inAnnoSignInView = true;
                // }));

                _connectResults.push(connect.connect(dom.byId("btnSigninWithAnno"), 'click', function(e)
                {
                    domStyle.set('pickNickNameContainer', 'display', 'none');
                    domStyle.set('signinContainer', 'display', 'none');
                    domStyle.set('annoSigninContainer', 'display', '');
                    domStyle.set('signinEmailContainer', 'display', '');
                    domStyle.set('signinFormContainer', 'display', 'none');
                    domStyle.set('btnBackEmail','display','none');
                    domStyle.set('signinMessage', 'display', 'none');
                    dom.byId("signinEmail").value = "";
                    dom.byId("signinEmailId").value = "";
                    dom.byId("signPwd").value = "";
                    dom.byId("nickNameSigninAnno").value = "";
                    domStyle.set('modelApp_signin', 'backgroundColor', '#DDDDDD');

                    transit(null, dom.byId('annoSigninContainer'), {
                        transition:"slide",
                        duration:300
                    });

                    inAnnoSignInView = true;
                }));
                 
                
                 _connectResults.push(connect.connect(dom.byId("btnNextAnnoSignin"), 'click', function(e)
                {   
                    getAllTeams();
                    domStyle.set('pickNickNameContainer', 'display', 'none');
                    domStyle.set('signinContainer', 'display', 'none');
                    domStyle.set('annoSigninContainer', 'display', '');
                    domStyle.set('signinEmailContainer', 'display', 'none');
                    domStyle.set('signinFormContainer', 'display', '');
                    domStyle.set('signinMessage', 'display', 'none');
                    domStyle.set('btnBackEmail','display','');
                    dom.byId("signPwd").value = "";
                    dom.byId("nickNameSigninAnno").value = "";
                    domStyle.set('modelApp_signin', 'backgroundColor', '#DDDDDD');

                    transit(null, dom.byId('signinFormContainer'), {

                    });
                    
                    inAnnoSignInView = true;
                }));

                _connectResults.push(connect.connect(dom.byId("btnBackEmail"), 'click', function(e)
                {   
                    ClearTeamOptions();
                    domStyle.set('pickNickNameContainer', 'display', 'none');
                    domStyle.set('signinContainer', 'display', 'none');
                    domStyle.set('annoSigninContainer', 'display', '');
                    domStyle.set('signinEmailContainer', 'display', '');
                    domStyle.set('signinFormContainer', 'display', 'none');
                    domStyle.set('signinMessage', 'display', 'none');
                    domStyle.set('btnBackEmail','display','none');
                    domStyle.set('select', 'display', 'none');
                    dom.byId("signinEmail").value = "";
                    dom.byId("signinEmailId").value = "";
                    dom.byId("signPwd").value = "";
                    dom.byId("nickNameSigninAnno").value = "";
                    domStyle.set('modelApp_signin', 'backgroundColor', '#DDDDDD');

                    transit(null, dom.byId('signinEmailContainer'), {
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

                _connectResults.push(connect.connect(dom.byId("imgUserSource"), 'click', function(e)
                {
                    if (logoClickCnt <2)
                    {
                        logoClickCnt ++;
                        return;
                    }

                    openServerURLDialog();
                    logoClickCnt = 0;
                }));

                _connectResults.push(connect.connect(dom.byId("btnCancelServerURL"), 'click', function(e)
                {
                    closeServerURLDialog();
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
