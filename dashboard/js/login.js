var DashboardLogin = angular.module('DashboardLogin', ['DashboardConstantsModule']);

DashboardLogin.controller('Login', ['$scope', '$http', '$window', '$location', 'DashboardConstants', function($scope, $http, $window, $location, DashboardConstants) {
	$scope.apiRoot = DashboardConstants.apiRoot[DashboardConstants.serverURLKey];
	$scope.endpointData = DashboardConstants.endpointUrl["account.dashboard.authenticate"];
    $scope.url = $scope.apiRoot + "/" + $scope.endpointData.root + "/" + DashboardConstants.endpointVersion + "/" + $scope.endpointData.path;
    $scope.params = { "user_email" : $scope.email, "team_key" : $scope.teamkey, "password" : $scope.password };

	$scope.authenticate_dashboard = function() {
		$scope.params = { "user_email" : $scope.email, "team_key" : $scope.teamkey, "password" : $scope.password };

		$scope.req = {
			method: $scope.endpointData.method,
			url: $scope.url,
			headers: { 'Content-Type': 'application/json' },
			data: $scope.params,
		};

		$http($scope.req).success(function(data, status){
			if (data.authenticated) {
				$window.location.href = $location.absUrl().replace('login.html', 'index.html');
			}
		});
	};
}]);