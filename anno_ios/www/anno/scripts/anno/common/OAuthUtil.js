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
            anno:'anno'
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
                        console.error("post res: " + JSON.stringify(data));

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
                            alert("Get access token error, please login again.");
                            if (self.authCallback)
                            {
                                self.authCallback({success: false});
                            }
                        }
                    }, function (err)
                    {
                        console.error("post res error: " + err);
                        alert("Get access token error: " + err);
                        if (self.authCallback)
                        {
                            self.authCallback({success: false});
                        }
                    });
            }
            else if (error)
            {
                console.error("error: " + error[1]);
                alert("Auth error: " + error[1]);
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
                    alert("Load Google oauth2 API failed, "+res.error.message);
                    if (self.authCallback)
                    {
                        self.authCallback({success:false});
                    }
                }
                else
                {
                    console.error("oauth loaded");
                    var request = gapi.client.oauth2.userinfo.get();
                    request.execute(function(userinfo){
                        console.error("get userinfo res: "+ userinfo);
                        if (userinfo.error)
                        {
                            alert("Get userinfo failed: "+ userinfo.error.message);
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
            if (userInfo.signinmethod == this.signinMethod.anno)
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
                    console.error("access token res: " + JSON.stringify(data));
                    self.setAccessToken(data);

                    callback();
                }, function (err)
                {
                    console.error("refresh access token error: " + err);
                    alert("refresh access token error: " + err);
                    if (errorCallback)
                    {
                        errorCallback();
                    }
                    else
                    {
                        annoUtil.hideLoadingIndicator();
                    }
                });
        },
        isAuthorized:function()
        {
            var params = annoUtil.parseUrlParams(document.location.search);
            console.error("got params: "+ JSON.stringify(params));
            var token = params['token'];
            var newUser = params['newuser'];
            var signinMethod = params['signinmethod'];
            var ret = {authorized:false};

            if (DBUtil.hasUserInLocalDB)
            {
                if (DBUtil.localUserInfo.signinmethod == this.signinMethod.google)
                {
                    var refreshToken = this.getRefreshToken();
                    if (refreshToken&&refreshToken!= 'undefined')
                    {
                        ret = {
                            authorized:true,
                            newUser:newUser=='1',
                            signinMethod:signinMethod,
                            token:token
                        };
                    }
                }
                else
                {
                    ret = {
                        authorized:true,
                        newUser:newUser=='1',
                        signinMethod:signinMethod,
                        token:token
                    };
                }
            }

            if (token)
            {
                this.setAccessToken(JSON.parse(token));
            }
            console.error('isAuthorized :'+JSON.stringify(ret));
            return ret;
        },
        getRefreshToken: function()
        {
            var rt = window.localStorage.getItem(this.refreshTokenKey);
            console.error("refresh token:" + rt);
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
        setAccessToken: function(tokenObject)
        {
            if (gapi&&gapi.auth)
            {
                this.accessToken = tokenObject;
                this.accessTokenTime = (new Date()).getTime();
                console.error(gapi.auth);
                gapi.auth.setToken(tokenObject);
            }
            else
            {
                var self = this;
                window.setTimeout(function(){
                    self.setAccessToken(tokenObject);
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
            var url = this.getPhoneGapPath(source)+"anno/pages/auth/main.html?callback="+document.location.href;
            var ref2 = window.open(url, '_self', 'location=no');

            console.error("anno auth page url: "+url);
        },
        processBasicAuthToken: function(userInfo)
        {
            var token = {'token_type':'Basic'};

            token.expires_in = 3600*24;
            token.access_token = annoUtil.encodeBase64(userInfo.email+":"+userInfo.password);

            this.setBasicAuthToken(token);
            return token;
        },
        setBasicAuthToken: function(token)
        {
            if (gapi&&gapi.auth)
            {
                gapi.auth.setToken(token);
            }
            else
            {
                var self = this;
                window.setTimeout(function(){
                    self.setAuthToken(token);
                }, 50)
            }
        }
    };

    return oauthUtil;
});