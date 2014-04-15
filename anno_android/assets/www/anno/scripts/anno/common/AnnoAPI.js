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
                                        annoUtil.readSettings(function(settings){
                                            if (settings.ServerURL == null)
                                            {
                                                annoUtil.inChina(function(inChina){
                                                    if (inChina)
                                                    {
                                                        console.error("in China, chooseProxyServer");
                                                        annoUtil.chooseProxyServer();console.error("in China, chooseProxyServer2");
                                                    }
                                                    else
                                                    {
                                                        annoUtil.setDefaultServer();
                                                    }

                                                    // call sign-up flow
                                                    annoAPI._doSignUpFlow();
                                                });
                                            }
                                            else
                                            {
                                                // call sign-up flow
                                                annoAPI._doSignUpFlow();
                                            }
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
                                    annoUtil.readSettings(function(settings){
                                        if (settings.ServerURL == null)
                                        {
                                            annoUtil.inChina(function(inChina){
                                                if (inChina)
                                                {
                                                    console.error("in China, chooseProxyServer");
                                                    annoUtil.chooseProxyServer();console.error("in China, chooseProxyServer2");
                                                }
                                                else
                                                {
                                                    annoUtil.setDefaultServer();
                                                }

                                                // call sign-up flow
                                                annoAPI._doSignUpFlow();
                                            });
                                        }
                                        else
                                        {
                                            // call sign-up flow
                                            annoAPI._doSignUpFlow();
                                        }
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
                                }
                            }
                        });
                    }
                });
            }
            else
            {
                var self = this;
                window.setTimeout(function(){
                    annoAPI.signUp(userEmail);
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
            // call sign-up API
            var nickname = this._userNickname,
                email = this._userName,
                pwd = this.defaultPwd;

            var self = this;
            annoUtil.showLoadingIndicator();
            annoUtil.loadAPI(annoUtil.API.account, function(){
                var registerAPI = gapi.client.account.account.register({
                    'display_name':nickname,
                    'password':pwd,
                    'user_email':email
                });

                registerAPI.execute(function(resp){
                    if (!resp)
                    {
                        if (annoAPI._callback)
                        {
                            annoAPI._callback({
                                success: 0,
                                message: "Response from server are empty when calling account.register api."
                            });
                        }

                        annoUtil.hideLoadingIndicator();
                        return;
                    }

                    var emailExist = false, emailExistMsg;
                    if (resp.error)
                    {
                        if (resp.error.message == ("Email("+email+") already exists."))
                        {
                            emailExist = true;
                            emailExistMsg = resp.error.message;
                        }
                        else
                        {
                            if (annoAPI._callback)
                            {
                                annoAPI._callback({
                                    success: 0,
                                    message: "An error occurred when calling account.register api: "+resp.error.message
                                });
                            }

                            annoUtil.hideLoadingIndicator();
                            return;
                        }
                    }

                    if (!emailExist&&!resp.result)
                    {
                        if (annoAPI._callback)
                        {
                            annoAPI._callback({
                                success: 0,
                                message: "Response from server are empty when calling account.register api."
                            });
                        }

                        annoUtil.hideLoadingIndicator();
                        return;
                    }

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

                            DBUtil.localUserInfo.signedup = 1;

                            OAuthUtil.processBasicAuthToken(userInfo);
                            // start background sync
                            window.setTimeout(function(){
                                AnnoDataHandler.startBackgroundSync();
                            }, 5*1000);
                        }

                        annoUtil.hideLoadingIndicator();
                    });
                });
            });
        }
    };

    document.addEventListener("deviceready", function(){
        DBUtil.initDB();
    }, false);

    return annoAPI;
});