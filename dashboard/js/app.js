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

Dashboard.controller('Login', function($scope, $cookieStore, DashboardConstants, DataService) {
    $scope.initLogin = function() {
        // DataService.checkAuthentication();
    };

    $scope.authenticate_dashboard = function() {
        var params = {
            'user_email' : $scope.email,
            'password' : $scope.password,
            'team_key' : $scope.teamkey
        };

        DataService.authenticateDashboard(params);
    };
});

Dashboard.controller('Feed', function($scope, $cookieStore, DataService, DashboardConstants) {
    $scope.imageBasicURL = DashboardConstants.imageURL[DashboardConstants.serverURLKey];
    $scope.display_name = $cookieStore.get('user_display_name');
    $scope.email = $cookieStore.get('user_email');
    $scope.image_url = $cookieStore.get('user_image_url');

    $scope.initLogin = function() {
        // DataService.checkAuthentication();
    };

    DataService.getAppInfo($cookieStore.get('team_key'), function(data) {
        $scope.appInfo = data;
    });

    DataService.getAnnos(function(data, imageURL) {
        $scope.annoList = data.anno_list;
        console.log($scope.annoList);
        angular.forEach($scope.annoList, function(anno) {
			anno.tags = [];
			anno.mentions = [];
			if (anno.device_model in DashboardConstants.deviceList) {
				anno.device_model = DashboardConstants.deviceList[anno.device_model];
			}
        });
    });
});
