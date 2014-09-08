
annoApp.controller("AnnoLoginCtrl", [
    "$scope",
    "$routeParams",
    "AnnoConstants",
    "GAEAPILoader",
    function ($scope, $routeParams, AnnoConstants, GAEAPILoader)
    {
        /* Force Auth for now */
        var callback = $routeParams.callback;
        console.log("Forcing Auth", $routeParams);

        $scope.sign_in = function() {
            var email = byId('email').value;
            var pwd = byId('password').value;

            var parameter= {
                'password':pwd,
                'user_email':email
            }
            GAEAPILoader.loadAPI(AnnoConstants.API.account, function() {
                var method = gapi.client.account.account.authenticate(parameter);
                method.execute(function(resp) {
                    console.log(arguments, callback);
                    if (!resp.display_name) {

                    } else {

                        // Make this an ngService
                        var token = {'token_type':'Basic'};
                        token.expires_in = 3600*24;
                        token.access_token = btoa(parameter.user_email+":"+parameter.password);
                        gapi.auth.setToken(token);
                        var g = gapi.auth.getToken();
                        console.log(g);
                        localStorage['auth'] = JSON.stringify(g);
                        window.location.href = unescape(callback);
                    }
                    // var sep = callback.indexOf('?') == -1? '?': '&';
                    // var _cb = callback+sep +"token=9&newuser=0&signinmethod=anno";

                });
            });
        }

        $scope.google_plus_sign_in = function() {
            require(['anno/common/OAuthUtil'], function(OAuthUtil) {
                OAuthUtil.openAuthWindow(auth_cb);
            });

            function auth_cb() {
                console.log("AUTH CB", arguments);
            }
        }
    }]
);
console.log("setup", annoApp);
