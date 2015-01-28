'use strict';

var Dashboard = angular.module('Dashboard', ['DashboardConstantsModule', 'DataServiceModule']);

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

Dashboard.controller('Feed', function($scope) {
    console.log('Authenticated');
});
