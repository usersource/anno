var DashboardConstantsModule = angular.module('DashboardConstantsModule', []);

DashboardConstantsModule.value("DashboardConstants", {
    apiRoot : {
        "1" : "https://annoserver.appspot.com/_ah/api",
        "2" : "https://annoserver-test.appspot.com/_ah/api",
        "3" : "https://usersource-anno.appspot.com/_ah/api",
        "4" : "http://localhost:8081/_ah/api"
    },
    imageURL : {
        "1" : "https://annoserver.appspot.com/screenshot?anno_id=",
        "2" : "https://annoserver-test.appspot.com/screenshot?anno_id=",
        "3" : "https://usersource-anno.appspot.com/screenshot?anno_id=",
        "4" : "https://localhost:8081/screenshot?anno_id="
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
        },
        "anno.anno.dashboard.list" : {
            "root" : "anno",
            "path" : "anno/dashboard",
            "method" : "GET"
        }
    }
});
