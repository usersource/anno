define([
    "dojo/_base/declare",
    "./DBUtil",
    "./Util",
    "./OAuthUtil",
    "../anno/AnnoDataHandler"
], function (declare, DBUtil, annoUtil, OAuthUtil, AnnoDataHandler)
{
    var annoAPI = {
        defaultPwd: "123456",
        networkCheckerInterval: 60*1000, // 60 seconds
        setAppKey: function(appKey, callback)
        {
            if (!appKey)
            {
                callback({success:false, message:"app key is required."});
                return;
            }

            this._getAppKey(function(_appKey){
                var newRecord = !_appKey;
                annoUtil.saveSettings({item: "appKey", value: appKey}, function (success)
                {
                    console.error("saveSettings callback");
                    if (success)
                    {
                        callback({success: true, message: "set app key succeeded."});
                        return;
                    }
                    else
                    {
                        callback({success: false, message: "set app key failed."});
                        return;
                    }
                }, newRecord);
            });
        },
        authenticate: function(userEmail, userNickname, callback)
        {
            this._userName = userEmail;
            this._userNickname = userNickname;
            this._callback = callback;
            console.error("signUp: "+userEmail);
            var self = this;

            if (DBUtil.userChecked)
            {
                this._getAppKey(function(_appKey){
                    if (!_appKey)
                    {
                        annoAPI._callback({
                            success: -1,
                            message: "app key has not been set, please call setAppKey API first."
                        });
                    }
                    else
                    {
                        AnnoDataHandler.getCurrentUserInfo(function(userInfo){
                            if (userInfo.userId)
                            {
                                // user is already sign-up in anno plugin, then check if user has do back-end sign-up
                                if (!userInfo.signedup)
                                {
                                    console.error("User is already exist but not signedup.");
                                    // do back-end, sign-up if has network connection
                                    if (annoUtil.hasConnection())
                                    {
                                        // choose Server URL
                                        annoAPI._chooseServer(function(){
                                            // call sign-up flow
                                            annoAPI._doSignUpFlow();
                                        });
                                    }
                                    else
                                    {
                                        if (annoAPI._callback)
                                        {
                                            annoAPI._callback({
                                                success: 2,
                                                message: "User "+ userEmail +" is already sign-up."
                                            });
                                        }

                                        window.setTimeout(function(){
                                            annoAPI._checkNetwork(function(){
                                                annoAPI._chooseServer(function(){
                                                    // call sign-up flow
                                                    annoAPI._doSignUpFlow();
                                                });
                                            });
                                        }, annoAPI.networkCheckerInterval);
                                    }
                                }
                                else
                                {
                                    if (annoAPI._callback)
                                    {
                                        if (annoUtil.hasConnection())
                                        {
                                            OAuthUtil.processBasicAuthToken({email:userEmail, password:annoAPI.defaultPwd});
                                            // start background sync
                                            window.setTimeout(function(){
                                                AnnoDataHandler.startBackgroundSync();
                                            }, 5*1000);
                                        }
                                        else
                                        {
                                            window.setTimeout(function(){
                                                annoAPI._checkNetwork(function(){
                                                    OAuthUtil.processBasicAuthToken({email:userEmail, password:annoAPI.defaultPwd});
                                                    // start background sync
                                                    window.setTimeout(function(){
                                                        AnnoDataHandler.startBackgroundSync();
                                                    }, 5*1000);
                                                });
                                            }, annoAPI.networkCheckerInterval);
                                        }

                                        annoAPI._callback({
                                            success: 2,
                                            message: "User "+ userEmail +" is already sign-up."
                                        });
                                    }
                                }
                            }
                            else
                            {
                                // sign-up flow
                                // if there is no network connection, just save user into into local db, then do sign-up flow when network connection is available
                                if (annoUtil.hasConnection())
                                {
                                    // choose Server URL
                                    annoAPI._chooseServer(function(){
                                        // call sign-up flow
                                        annoAPI._doSignUpFlow();
                                    });
                                }
                                else
                                {
                                    var userInfo = {};
                                    userInfo.userId = annoAPI._userName;
                                    userInfo.email = annoAPI._userName;
                                    userInfo.password = annoAPI.defaultPwd;
                                    userInfo.signinMethod = "anno";
                                    userInfo.nickname = annoAPI._userNickname;
                                    userInfo.signedup = 0;

                                    AnnoDataHandler.saveUserInfo(userInfo, function(){
                                        if (annoAPI._callback)
                                        {
                                            annoAPI._callback({
                                                success: 1,
                                                message: "user sign-up succeeded. "
                                            });
                                        }

                                        annoUtil.hideLoadingIndicator();
                                    });

                                    window.setTimeout(function(){
                                        annoAPI._checkNetwork(function(){
                                            annoAPI._chooseServer(function(){
                                                // call sign-up flow
                                                annoAPI._doSignUpFlow();
                                            });
                                        });
                                    }, annoAPI.networkCheckerInterval);
                                }
                            }
                        });
                    }
                });
            }
            else
            {
                window.setTimeout(function(){
                    annoAPI.signUp(userEmail, userNickname, callback);
                }, 20);
            }
        },
        _getAppKey: function(callback)
        {
            annoUtil.readSettings(function(settings){
                callback(settings.appKey);
            });
        },
        _doSignUpFlow: function()
        {
            document.getElementById('networkMsg').innerHTML = "call backend sign-up...";
            // call sign-up API
            var nickname = this._userNickname,
                email = this._userName,
                pwd = this.defaultPwd;

            var self = this;
            var APIConfig = {
                name: annoUtil.API.account,
                method: "account.account.register",
                parameter: {
                    'display_name':nickname,
                    'password':pwd,
                    'user_email':email
                },
                showErrorMessage:false,
                success: function(resp)
                {
                    // save user info into local db
                    var userInfo = {};
                    userInfo.userId = resp.result?resp.result.id:email;
                    userInfo.email = email;
                    userInfo.password = pwd;
                    userInfo.signinMethod = "anno";
                    userInfo.nickname = nickname;

                    var emailExist = false, emailExistMsg = "";
                    AnnoDataHandler.saveUserInfo(userInfo, function(){
                        if (annoAPI._callback)
                        {
                            if (emailExist)
                            {
                                annoAPI._callback({
                                    success: 2,
                                    message: emailExistMsg
                                });
                            }
                            else
                            {
                                annoAPI._callback({
                                    success: 1,
                                    message: "user sign-up succeeded. "
                                });
                            }

                            DBUtil.loadLocalUserInfo();

                            OAuthUtil.processBasicAuthToken(userInfo);
                            // start background sync
                            document.getElementById('networkMsg').innerHTML = "background sync running...";
                            window.setTimeout(function(){
                                AnnoDataHandler.startBackgroundSync();
                            }, 5*1000);
                        }

                        annoUtil.hideLoadingIndicator();
                    });
                },
                error: function(error, resp)
                {
                    var emailExist = false, emailExistMsg;
                    if (error)
                    {
                        if (error.message == ("Email("+email+") already exists."))
                        {
                            emailExist = true;
                            emailExistMsg = error.message;

                            // save user info into local db
                            var userInfo = {};
                            userInfo.userId = resp.result?resp.result.id:email;
                            userInfo.email = email;
                            userInfo.password = pwd;
                            userInfo.signinMethod = "anno";
                            userInfo.nickname = nickname;

                            AnnoDataHandler.saveUserInfo(userInfo, function(){
                                if (annoAPI._callback)
                                {
                                    if (emailExist)
                                    {
                                        annoAPI._callback({
                                            success: 2,
                                            message: emailExistMsg
                                        });
                                    }
                                    else
                                    {
                                        annoAPI._callback({
                                            success: 1,
                                            message: "user sign-up succeeded. "
                                        });
                                    }

                                    DBUtil.loadLocalUserInfo();

                                    OAuthUtil.processBasicAuthToken(userInfo);
                                    // start background sync
                                    document.getElementById('networkMsg').innerHTML = "background sync running...";
                                    window.setTimeout(function(){
                                        AnnoDataHandler.startBackgroundSync();
                                    }, 5*1000);
                                }

                                annoUtil.hideLoadingIndicator();
                            });
                        }
                        else
                        {
                            if (annoAPI._callback)
                            {
                                annoAPI._callback({
                                    success: 0,
                                    message: "An error occurred when calling account.register api: "+error.message
                                });
                            }
                        }
                    }
                }
            };

            annoUtil.callGAEAPI(APIConfig);
        },
        _reloadGCEClientLib: function()
        {
            var defaultGCELibSrc = "https://apis.google.com/js/client.js?onload=gce_init";
            var scriptTags = document.getElementsByTagName("script"), gceClientLibScriptTag;

            for (var i= 0,c=scriptTags.length;i<c;i++)
            {
                if (!scriptTags[i].src) continue;
                if (scriptTags[i].src.indexOf("http://apis.google.com/js/client.js") == 0 ||scriptTags[i].src.indexOf("https://apis.google.com/js/client.js") == 0)
                {
                    gceClientLibScriptTag = scriptTags[i];
                    break;
                }
            }


            if (gceClientLibScriptTag && gceClientLibScriptTag.getAttribute('gapi_processed') == 'true')
            {
                // GCE client lib was loaded successfully already, we don't need do anything.
                return;
            }

            if (gceClientLibScriptTag)
            {
                defaultGCELibSrc = gceClientLibScriptTag.src;
                gceClientLibScriptTag.remove();
            }

            // insert Google CE client lib script tag.
            var gceClientLibScriptTag = document.createElement('script'); gceClientLibScriptTag.type = 'text/javascript'; gceClientLibScriptTag.async = true;
            gceClientLibScriptTag.src = defaultGCELibSrc;
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(gceClientLibScriptTag, s);
        },
        _checkNetwork: function(callback)
        {
            document.getElementById('networkMsg').innerHTML = "checking network connection...";
            // check if network connection is available, if available, reload GCE client lib then call callback after 10 seconds, if not, wait a networkCheckerInterval value then check again.
            if (annoUtil.hasConnection())
            {
                document.getElementById('networkMsg').innerHTML = "Network connection on";
                annoAPI._reloadGCEClientLib();
                document.getElementById('networkMsg').innerHTML = "reloading Google CE client lib";
                window.setTimeout(callback, 10*1000);
            }
            else
            {
                window.setTimeout(function(){
                    annoAPI._checkNetwork(callback);
                }, annoAPI.networkCheckerInterval);
            }
        },
        _chooseServer: function(callback)
        {
            // choose default server or proxy server depends on if app running in China
            annoUtil.readSettings(function(settings){
                if (settings.ServerURL == null)
                {
                    annoUtil.setDefaultServer();
                }

                callback();
            });
        },
        enableNativeGesture:function()
        {
            annoUtil.enableNativeGesture();
        },
        disableNativeGesture: function()
        {
            annoUtil.disableNativeGesture();
        },
        enableJSGesture:function()
        {
            annoUtil.enableJSGesture();
        },
        disableJSGesture:function()
        {
            annoUtil.disableJSGesture();
        },
        triggerCreateAnno:function()
        {
            annoUtil.triggerCreateAnno();
        },
        setNetworkCheckerInterval: function(value)
        {
            this.networkCheckerInterval = value;
        }
    };

    document.addEventListener("deviceready", function(){
        DBUtil.initDB();
    }, false);

    return annoAPI;
});