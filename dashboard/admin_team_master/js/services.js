'use strict';

var ServiceModule = angular.module('ServiceModule', ['AdminTeamMasterConstantsModule']);

ServiceModule.factory('DataService', function($http, AdminTeamMasterConstants) {
    var apiRoot = AdminTeamMasterConstants.apiRoot;

    function makeHTTPCall(endpointName, params, success_callback, error_callback) {
        var endpointData = AdminTeamMasterConstants.endpointUrl[endpointName];
        var url = apiRoot + "/" + endpointData.root + "/" + AdminTeamMasterConstants.endpointVersion + "/" + endpointData.path;

        var req = {
            method : endpointData.method,
            url : url,
            params : params,
            cache : true
        };

        if (req.method === "POST") {
            req.data = params;
        }

        $http(req).success(function(data, status, header, config) {
            if (angular.isFunction(success_callback)) {
                success_callback(data);
            }
        }).error(function(data, status, header, config) {
            console.error("Error in", endpointName, ":", data.error);
            if (angular.isFunction(error_callback)) {
                error_callback(status);
            }
        });
    }

    return ({
        makeHTTPCall : makeHTTPCall
    });
});
