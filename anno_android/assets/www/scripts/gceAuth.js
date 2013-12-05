var oauthOptions = {
    client_id: '955803277195.apps.googleusercontent.com',
    client_secret: 'l5UwDYJuv2BdUUBF2tu9fsol',
    redirect_uri: 'http://localhost', //postmessage
    scope: 'https://www.googleapis.com/auth/userinfo.email'
};
require(["dojo/ready", "dojo/request/xhr", "anno/anno/AnnoDataHandler"], function(ready, xhr, AnnoDataHandler){

    var checkAuth = window.checkAuth = function()
    {
        var authUrl = 'https://accounts.google.com/o/oauth2/auth?' +
            "client_id="+oauthOptions.client_id+
            "&redirect_uri="+oauthOptions.redirect_uri+
            "&response_type=code"+
            "&origin=http://localhost:8080"+
            "&scope="+oauthOptions.scope;

        ref = window.open(authUrl, '_blank', 'location=no');
        ref.addEventListener('loadstart', checkCode);
        //window.plugins.childBrowser.onLocationChange = checkCode;
        //window.plugins.childBrowser.showWebPage(authUrl, { showLocationBar: false,showAddress:false,showNavigationBar:false });
    };

    var checkCoding = false;
    var checkCode = function(url)
    {
        url = url.url;
        var code = /\?code=(.+)$/.exec(url);
        var error = /\?error=(.+)$/.exec(url);

        if (code || error) {
            //Always close the browser when match is found
            console.error(code[1]);
            //window.plugins.childBrowser.close();
            ref.close();
        }

        if (code) {
            if (checkCoding) return;
            checkCoding = true;
            //Exchange the authorization code for an access token
            xhr.post('https://accounts.google.com/o/oauth2/token', {
                data:{
                    code: code[1],
                    client_id: oauthOptions.client_id,
                    client_secret: oauthOptions.client_secret,
                    redirect_uri: oauthOptions.redirect_uri,
                    grant_type: 'authorization_code'
                },
                handleAs:"json"
            }).then(function(data) {
                    console.error("post res: "+JSON.stringify(data));


                    if (_hasUserInLocalDB)
                    {
                        if (window.authCallback)
                        {
                            window.authCallback({success:true, token:data});
                        }
                    }
                    else
                    {
                        gapi.auth.setToken(data);
                        getUserInfo(data);
                    }

                }, function(err){
                    console.error("post res error: "+err);
                    alert("Get access token error: "+err);
                    if (window.authCallback)
                    {
                        window.authCallback({success:false})
                    }
                });
        } else if (error) {
            console.error("error: "+error[1]);
            alert("Auth error: "+error[1]);
            if (window.authCallback)
            {
                window.authCallback({success:false})
            }
        }
    };

    var getUserInfo = function(token)
    {
        gapi.client.load('oauth2', 'v2', function() {
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

                if (window.authCallback)
                {
                    window.authCallback({success:true, userInfo:userinfo, token:token});
                }

                //AnnoDataHandler.startBackgroundSync();
            });
        });
    };

    //document.addEventListener('deviceready', checkAuth, false);
});