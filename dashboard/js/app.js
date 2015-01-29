'use strict';

var Dashboard = angular.module('Dashboard', ['ngCookies', 'DashboardConstantsModule', 'DataServiceModule']);

Dashboard.config(['$httpProvider', function($httpProvider) {
    var $cookies;
    angular.injector(['ngCookies']).invoke(function(_$cookies_) {
        $cookies = _$cookies_;
    });

    var userTeamToken = angular.fromJson($cookies.user_team_token);
    if (userTeamToken != undefined) {
        $httpProvider.defaults.headers.common.Authorization = userTeamToken.token_type + ' ' + userTeamToken.access_token;
    }
    $httpProvider.defaults.headers.common.contentType = 'application/json';
}]);

Dashboard.controller('Login', function($scope, DashboardConstants, DataService) {
    $scope.authenticate_dashboard = function() {
        var params = {
            'user_email' : $scope.email,
            'password' : $scope.password,
            'team_key' : $scope.teamkey
        };

        DataService.authenticateDashboard(params);
    };
});

Dashboard.controller('Feed', function($scope, $window, DataService) {
    $scope.userData = angular.fromJson($window.localStorage.user);
    DataService.getAppInfo($scope.userData.team_key, function(data) {
        $scope.appInfo = data;
    });
});
