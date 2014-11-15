define([
    "dojo/_base/lang",
    "dojo/request/xhr",
    "anno/common/DBUtil",
    "anno/common/Util"
], function (lang, xhr, DBUtil, annoUtil)
{

    var oauthUtil = {
        oauthOptions: {
            redirect_uri: 'http://localhost',
            scope: 'https://www.googleapis.com/auth/userinfo.email'
        },
        grantTypes: {
            AUTHORIZE: "authorization_code",
            REFRESH: "refresh_token"
        },
        signinMethod:{
            google:'google',
            anno:'anno',
            plugin:'plugin'
        },
        authUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://accounts.google.com/o/oauth2/token",
        authWindowRef: null,
        checkingAuthCode:false,
        refreshTokenKey: "refresh_token",
        accessToken:null,
        accessTokenTime:0,
        accessTokenExpiryLimit:58 * 60 * 1000,
        openAuthWindow: function (authCallback)
        {
            this.authCallback = authCallback;
            var apiConfig = annoUtil.getCEAPIConfig();
            var url = this.authUrl +
                "?client_id=" + apiConfig.clientId +
                "&redirect_uri=" + this.oauthOptions.redirect_uri +
                "&response_type=code" +
                "&origin=http://localhost:8080" +
                "&access_type=offline" +
                "&approval_prompt=force" +
                "&scope=" + this.oauthOptions.scope;

            this.checkingAuthCode = false;
            this.authWindowRef = window.open(url, '_blank', 'location=no');
            this.authWindowRef.addEventListener('loadstart', lang.hitch(this, this._checkAuthCode));
        },
        _checkAuthCode: function (event)
        {
            var url = event.url;
            var code = /\?code=(.+)$/.exec(url);
            var error = /\?error=(.+)$/.exec(url);

            if (code || error)
            {
                //Always close the browser when match is found
                console.error(code[1]);
                this.authWindowRef.close();
            }

            if (code)
            {
                if (this.checkingAuthCode) return;
                this.checkingAuthCode = true;

                var self = this;
                var apiConfig = annoUtil.getCEAPIConfig();
                //Exchange the authorization code for an access token
                xhr.post(this.tokenUrl, {
                    data: {
                        code: code[1],
                        client_id: apiConfig.clientId,
                        client_secret: apiConfig.clientSecret,
                        redirect_uri: this.oauthOptions.redirect_uri,
                        grant_type: this.grantTypes.AUTHORIZE
                    },
                    handleAs: "json"
                }).then(function (data)
                    {
                        console.log("post res: " + JSON.stringify(data));

                        if (data&&data.refresh_token)
                        {
                            self._saveRefreshToken(data);
                            if (DBUtil.hasUserInLocalDB)
                            {
                                if (self.authCallback)
                                {
                                    self.authCallback({success: true, token: data});
                                }
                            }
                            else
                            {
                                gapi.auth.setToken(data);
                                self.getUserInfo(data);
                            }
                        }
                        else
                        {
                            annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.GET_OAUTH_TOKEN, message: "Get access token error, please login again."});

                            if (self.authCallback)
                            {
                                self.authCallback({success: false});
                            }
                        }
                    }, function (err)
                    {
                        annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.GET_OAUTH_TOKEN, message: "Get access token error: "+ err});
                        if (self.authCallback)
                        {
                            self.authCallback({success: false});
                        }
                    });
            }
            else if (error)
            {
                annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.GET_OAUTH_TOKEN, message: "Auth error: " + error[1]});
                if (self.authCallback)
                {
                    self.authCallback({success: false});
                }
            }
        },
        getUserInfo: function(token)
        {
            var self = this;
            gapi.client.load('oauth2', 'v2', function(res) {

                if (res&&res.error)
                {
                    annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.LOAD_GAE_API, message: "Load Google oauth2 API failed, "+res.error.message});
                    if (self.authCallback)
                    {
                        self.authCallback({success:false});
                    }
                }
                else
                {
                    console.log("oauth loaded");
                    var request = gapi.client.oauth2.userinfo.get();
                    request.execute(function(userinfo){
                        console.log("get userinfo res: " + userinfo);
                        if (userinfo.error)
                        {
                            annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.API_CALL_FAILED, message: "Get userinfo failed: "+ userinfo.error.message});
                            return;
                        }

                        currentUserInfo = userinfo;

                        if (self.authCallback)
                        {
                            self.authCallback({success:true, userInfo:userinfo, token:token});
                        }
                    });
                }
            });
        },
        _saveRefreshToken: function(token)
        {
            window.localStorage.setItem(this.refreshTokenKey, token.refresh_token);
        },
        getAccessToken:function(callback, errorCallback)
        {
            var userInfo = annoUtil.getCurrentUserInfo();
            if (userInfo.signinmethod == this.signinMethod.anno ||
                userInfo.signinmethod == this.signinMethod.plugin)
            {
                callback();
                return;
            }

            if (this.accessToken&&!this._isTokenExpired())
            {
                callback();
                return;
            }

            var self = this;
            //Exchange the refresh token for an access token
            var apiConfig = annoUtil.getCEAPIConfig();
            xhr.post(this.tokenUrl, {
                data: {
                    client_id: apiConfig.clientId,
                    client_secret: apiConfig.clientSecret,
                    refresh_token: this.getRefreshToken(),
                    grant_type: this.grantTypes.REFRESH
                },
                handleAs: "json"
            }).then(function (data)
                {
                    console.log("access token res: " + JSON.stringify(data));
                    self.setAccessToken(data, callback);
                }, function (err)
                {
                    annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.REFRESH_OAUTH_TOKEN, message:"refresh access token error: " + err});
                    if (errorCallback)
                    {
                        errorCallback(err);
                    }
                    else
                    {
                        annoUtil.hideLoadingIndicator();
                    }
                });
        },
        isAuthorized:function()
        {
            function setAuthTrue() {
                ret = {
                    authorized : true,
                    newUser : newUser == '1',
                    signinMethod : signinMethod,
                    token : token
                };
            }

            var params = annoUtil.parseUrlParams(document.location.search);
            console.log("got params: " + JSON.stringify(params));
            var token = params['token'];
            var newUser = params['newuser'];
            var signinMethod = params['signinmethod'];
            var ret = { authorized : false };

            if (DBUtil.hasUserInLocalDB) {
                switch(DBUtil.localUserInfo.signinmethod) {
                    case this.signinMethod.google:
                        var refreshToken = this.getRefreshToken();
                        if (refreshToken && refreshToken != 'undefined') {
                            setAuthTrue();
                        }
                        break;
                    case this.signinMethod.anno:
                    case this.signinMethod.plugin:
                        setAuthTrue();
                        break;
                }
            }

            if (token) {
                this.setAccessToken(JSON.parse(token));
            }

            console.log('isAuthorized :' + JSON.stringify(ret));
            return ret;
        },
        getRefreshToken: function()
        {
            var rt = window.localStorage.getItem(this.refreshTokenKey);
            console.log("refresh token:" + rt);
            return rt;
        },
        clearRefreshToken: function()
        {
            window.localStorage.setItem(this.refreshTokenKey, "");
        },
        _isTokenExpired: function()
        {
            var currentTime = (new Date()).getTime();

            return !(currentTime < (this.accessTokenTime + this.accessTokenExpiryLimit));
        },
        setAccessToken: function(tokenObject, callback)
        {
            if (window.gapi&&window.gapi.auth)
            {
                this.accessToken = tokenObject;
                this.accessTokenTime = (new Date()).getTime();
                // console.error(gapi.auth);
                gapi.auth.setToken(tokenObject);

                if (callback)
                {
                    callback();
                }
            }
            else
            {
                var self = this;
                window.setTimeout(function(){
                    self.setAccessToken(tokenObject, callback);
                }, 50)
            }
        },
        getPhoneGapPath:function(source)
        {
            source = source||"home";
            var path = window.location.pathname;
            if (source == "home")
            {
                // for anno/pages/community/main.html
                path = path.substr(0, path.length - 30);
            }
            else
            {
                // for anno/pages/annodraw/main.html
                path = path.substr(0, path.length - 29);
            }

            return 'file://' + path;
        },
        openAuthPage: function(source)
        {
            var url = this.getPhoneGapPath(source) + "anno/pages/auth/main.html?callback=" + document.location.href;
            var ref2 = window.open(url, '_self', 'location=no');
            console.log("anno auth page url: " + url);
        },
        processBasicAuthToken: function(userInfo)
        {
            var token = { 'token_type' : 'Basic' },
                userInfoData = [userInfo.signinMethod, userInfo.email, userInfo.password, userInfo.team_key, userInfo.team_secret];

            token.expires_in = 3600 * 24;
            token.access_token = annoUtil.encodeBase64(userInfoData.join(":"));
            this.setBasicAuthToken(token);
            annoUtil.basicAccessToken = token;
            return token;
        },
        setBasicAuthToken: function(token)
        {
            if (window.gapi&&window.gapi.auth)
            {
                gapi.auth.setToken(token);
            }
            else
            {
                var self = this;
                window.setTimeout(function(){
                    self.setBasicAuthToken(token);
                }, 50)
            }
        }
    };

    return oauthUtil;
});