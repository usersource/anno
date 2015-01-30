var DataServiceModule = angular.module('DataServiceModule', ['ngCookies', 'DashboardConstantsModule']);

DataServiceModule.factory('DataService', function($http, $location, $window, $cookieStore, DashboardConstants) {
    var apiRoot = DashboardConstants.apiRoot[DashboardConstants.serverURLKey];

    function storeUserDataInCookies(data) {
        $cookieStore.put('authenticated', data.authenticated);
        $cookieStore.put('user_display_name', data.display_name);
        $cookieStore.put('user_email', data.email);
        $cookieStore.put('user_image_url', data.image_url);
        $cookieStore.put('team_key', data.team_key);
        $cookieStore.put('team_name', data.team_name);
        $cookieStore.put('user_team_token', angular.fromJson(data.user_team_token));
    }

    function removeUserDataCookies() {
        $cookieStore.put('authenticated', false);
        $cookieStore.remove('user_display_name');
        $cookieStore.remove('user_email');
        $cookieStore.remove('user_image_url');
        $cookieStore.remove('team_key');
        $cookieStore.remove('team_name');
        $cookieStore.remove('user_team_token');
    }

    function checkAuthentication() {
        var currentPath = $location.path();
        if ($cookieStore.get('authenticated')) {
            if (currentPath == 'login.html') {
                $window.location.href = $location.absUrl().replace('login.html' , 'index.html');
            }
        } else {
            if (currentPath == 'index.html') {
                $window.location.href = $location.absUrl().replace('index.html' , 'login.html');
                this.removeUserDataCookies();
            }
        }
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

    function getAnnos(callback) {
        var endpointData = DashboardConstants.endpointUrl["anno.anno.dashboard.list"];
        var url = apiRoot + "/" + endpointData.root + "/" + DashboardConstants.endpointVersion + "/" + endpointData.path;

        var req = {
            method : endpointData.method,
            url : url,
            params : { outcome : 'cursor,has_more,anno_list' },
            cache : true
        };

        $http(req).success(function(data, status, header, config) {
            if (status == 200) {
                callback(data);
            }
        }).error(function(data, status, header, config) {
            console.error("Error while getting anno");
        });
    }

    return ({
        storeUserDataInCookies : storeUserDataInCookies,
        removeUserDataCookies : removeUserDataCookies,
        checkAuthentication : checkAuthentication,
        authenticateDashboard : authenticateDashboard,
        getAppInfo : getAppInfo,
        getAnnos : getAnnos
    });
});
