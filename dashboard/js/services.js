var DataServiceModule = angular.module('DataServiceModule', ['ngCookies', 'DashboardConstantsModule']);

DataServiceModule.factory('DataService', function($http, $location, $window, $cookieStore, DashboardConstants) {
    var apiRoot = DashboardConstants.apiRoot[DashboardConstants.serverURLKey];

    function storeUserDataInCookies(data) {
        $cookieStore.put('user_display_name', data.display_name);
        $cookieStore.put('user_email', data.email);
        $cookieStore.put('user_image_url', data.image_url);
        $cookieStore.put('team_key', data.team_key);
        $cookieStore.put('team_name', data.team_name);
        $cookieStore.put('user_team_token', angular.fromJson(data.user_team_token));
    }

    function authenticateDashboard(params) {
        var self = this;
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
                self.storeUserDataInCookies(data);
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
        storeUserDataInCookies : storeUserDataInCookies,
        authenticateDashboard : authenticateDashboard,
        getAppInfo : getAppInfo
    });
});
