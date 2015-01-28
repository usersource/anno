var DashboardConstantsModule = angular.module('DashboardConstantsModule', []);

DashboardConstantsModule.value("DashboardConstants", {
    apiRoot : {
        "1" : "https://annoserver.appspot.com/_ah/api",
        "2" : "https://annoserver-test.appspot.com/_ah/api",
        "3" : "https://usersource-anno.appspot.com/_ah/api",
        "4" : "http://localhost:8081/_ah/api"
    },
    serverURLKey: "3",
    endpointVersion: "1.0",
    endpointUrl : {
        "account.dashboard.authenticate" : {
            "root" : "account",
            "path" : "account/dashboard/authenticate",
            "method" : "POST"
        },
        "appinfo.appinfo.get" : {
            "root" : "appinfo",
            "path" : "appinfo/get",
            "method" : "GET"
        }
    }
});
