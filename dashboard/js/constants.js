var DashboardConstantsModule = angular.module('DashboardConstantsModule', []);

DashboardConstantsModule.value("DashboardConstants", {
    apiRoot : {
        "1" : "https://annoserver.appspot.com/_ah/api",
        "2" : "https://annoserver-test.appspot.com/_ah/api",
        "3" : "https://usersource-anno.appspot.com/_ah/api",
        "4" : "http://localhost:8081/_ah/api"
    },
    apiUrl : {
        "account.dashboard.authenticate" : {
            "root" : "account",
            "path" : "account/dashboard/authenticate",
            "method" : "POST"
        }
    },
    serverURLKey: "4",
    apiVersion: "1.0"
});