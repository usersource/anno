function authIfNotAuth(gaeLoader, cb) {
    gaeLoader.loadAPI('account', function() {

        var token = gapi.auth.getToken();
        console.log(token);

        if (token && token.access_token) {
            return cb(true);
        } else {
            token = localStorage['auth'];
            if (token != null) {
                gapi.auth.setToken(JSON.parse(token));
                return cb(true);
            }
        }
        window.location.href = '../auth/index.html#/callback/'+window.location.href;
    });
    // require(['anno/common/OAuthUtil'], function(OAuthUtil) {
    //     gaeLoader.loadAPI('user', function() {
    //         if (!OAuthUtil.isAuthorized().authorized) {
    //             // redirect to auth page
    //             window.location.href = '../auth/index.html#/callback/'+window.location.href;
    //         }
    //     });
    // });
}
annoApp.controller("ViewTeamActivityCtrl", [
    "$scope",
    "$routeParams",
    "AnnoConstants",
    "GAEAPILoader",
    function ($scope, $routeParams, AnnoConstants, GAEAPILoader)
    {
        var teamId = $routeParams.teamId;
        var cursorId = $routeParams.cursorId;
        console.log($routeParams);

        var parameters = {
            'query_type': 'by_community',
            'community': teamId,
            'cursor': cursorId
        };

        function loadTeam(parameter) {
            GAEAPILoader.loadAPI(AnnoConstants.API.anno, function() {
                console.log(gapi);
                gapi.client.anno.anno.list(parameter).execute(function(resp) {
                    if (resp.anno_list) {
                        $scope.anno_list = $scope.anno_list || [];
                        $scope.anno_list = $scope.anno_list.concat(resp.anno_list);
                        $scope.cursorId = resp.cursor;
                        $scope.has_more = resp.has_more;
                        $scope.teamId = teamId;
                    }
                    $scope.$apply();
                })
            });
        }

        $scope.load_more_annos = function() {
            // window.location.href = "#/team/"+$scope.teamId+"/cursor/"+$scope.cursorId;
            loadTeam({
                'query_type': 'by_community',
                'community': $scope.teamId,
                'cursor': $scope.cursorId
            });
        }

        authIfNotAuth(GAEAPILoader, function() { loadTeam(parameters) });

    }]
);

annoApp.controller("HomeCtrl", [
    "$scope",
    "$routeParams",
    "AnnoConstants",
    "GAEAPILoader",
    function ($scope, $routeParams, AnnoConstants, GAEAPILoader) {

        // Auth check
        authIfNotAuth(GAEAPILoader, loadList);

        function loadList() {
            // Load the User API
            GAEAPILoader.loadAPI(AnnoConstants.API.user, function() {
                console.log(gapi);

                // Get the community list
                gapi.client.user.community.list({}).execute(function(resp) {
                    if (resp.community_list) {
                        $scope.community_list = resp.community_list;
                    }

                    // Important, everything is async
                    $scope.$apply();
                })
            });
        }
    }]
);