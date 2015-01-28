var DataServiceModule = angular.module('DataServiceModule', ['DashboardConstantsModule']);

DataServiceModule.factory('DataService', function($http, $location, $window, DashboardConstants) {
    var apiRoot = DashboardConstants.apiRoot[DashboardConstants.serverURLKey];

    function authenticateDashboard(params) {
        var endpointData = DashboardConstants.endpointUrl["account.dashboard.authenticate"];
        var url = apiRoot + "/" + endpointData.root + "/" + DashboardConstants.endpointVersion + "/" + endpointData.path;

        var req = {
            method: endpointData.method,
            url: url,
            headers: { 'Content-Type': 'application/json' },
            data: params
        };

        $http(req).then(function(resp) {
            if (resp.status == 200) {
                resp.data['email'] = params.user_email;
                $window.localStorage['user'] = angular.toJson(resp.data);
                if (resp.data.authenticated) {
                    $window.location.href = $location.absUrl().replace('login.html', 'index.html');
                }
            }
        });
    }

    function getAppInfo(team_key, callback) {
        var endpointData = DashboardConstants.endpointUrl["appinfo.appinfo.get"];
        var url = apiRoot + "/" + endpointData.root + "/" + DashboardConstants.endpointVersion + "/" + endpointData.path;

        var req = {
            method: endpointData.method,
            url: url + '?team_key=' + team_key,
            headers: { 'Content-Type': 'application/json' },
            data: { team_key : team_key }
        };

        $http(req).then(function(resp) {
            if (resp.status == 200) {
                callback(resp.data);
            }
        });
    }

    return ({
        authenticateDashboard : authenticateDashboard,
        getAppInfo : getAppInfo
    });
});
