var DashboardLogin = angular.module('DashboardLogin', ['DashboardConstantsModule']);

var url = "https://usersource-anno.appspot.com/_ah/api/account/1.0/account/dashboard/authenticate";

DashboardLogin.controller('Login', function($scope, $http) {
	$scope.authenticate_dashboard = function() {
	        var params = { "user_email" : $scope.email, "team_key" : $scope.teamkey, "password" : $scope.password };
	        $http.post(url, params).success(function(data) {
	                $scope.data = data;
	        });
	};
});