var DataServiceModule = angular.module('DataServiceModule', ['DashboardConstantsModule']);

DataServiceModule.factory('DataService', function($http, $location, $window, DashboardConstants) {
    var apiRoot = DashboardConstants.apiRoot[DashboardConstants.serverURLKey];

    function authenticateDashboard(params) {
        var endpointData = DashboardConstants.endpointUrl["account.dashboard.authenticate"];
        var url = apiRoot + "/" + endpointData.root + "/" + DashboardConstants.endpointVersion + "/" + endpointData.path;

        var req = {
            method : endpointData.method,
            url : url,
            data : params
        };

        $http(req).success(function(data, status, header, config) {
            if (status == 200) {
                data['email'] = params.user_email;
                $window.localStorage['user'] = angular.toJson(data);
                if (data.authenticated) {
                    $window.location.href = $location.absUrl().replace('login.html', 'index.html');
                }
            }
        }).error(function(data, status, header, config) {
            console.error("Invalid email or password");
        });
    }

    function getAppInfo(team_key, callback) {
        var endpointData = DashboardConstants.endpointUrl["appinfo.appinfo.get"];
        var url = apiRoot + "/" + endpointData.root + "/" + DashboardConstants.endpointVersion + "/" + endpointData.path;

        var req = {
            method : endpointData.method,
            url : url,
            params : { team_key : team_key },
            cache : true
        };

        $http(req).success(function(data, status, header, config) {
            if (status == 200) {
                callback(data);
            }
        }).error(function(data, status, header, config) {
            console.error("Error while getting app info");
        });
    }

    return ({
        authenticateDashboard : authenticateDashboard,
        getAppInfo : getAppInfo
    });
});
