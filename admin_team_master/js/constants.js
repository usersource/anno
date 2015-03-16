'use strict';

var AdminTeamMasterConstantsModule = angular.module('AdminTeamMasterConstantsModule', []);

AdminTeamMasterConstantsModule.value("AdminTeamMasterConstants", {
    apiRoot : "/_ah/api",
    endpointVersion: "1.0",
    endpointUrl : {
        "community.community.admin_master" : {
            "root" : "community",
            "path" : "community/admin_master_data",
            "method" : "GET"
        }
    }
});
