'use strict';

var AdminTeamMasterConstantsModule = angular.module('AdminTeamMasterConstantsModule', []);

AdminTeamMasterConstantsModule.value("AdminTeamMasterConstants", {
    apiRoot : "/_ah/api",
    endpointVersion: "1.0",
    endpointUrl : {
        "account.dashboard.authenticate" : {
            "root" : "account",
            "path" : "account/dashboard/authenticate",
            "method" : "POST"
        }
    }
});
