'use strict';

var DashboardConstantsModule = angular.module('DashboardConstantsModule', []);

DashboardConstantsModule.value("DashboardConstants", {
    filters : {
        "basic" : "basic",
        "myMentions" : "by_my_mentions"
    },
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
        },
        "anno.anno.teamnotes.insert" : {
            "root" : "anno",
            "path" : "anno/teamnotes",
            "method" : "POST"
        },
        "followup.followup.insert" : {
            "root" : "followup",
            "path" : "followup",
            "method" : "POST"
        },
        "user.user.community.users" : {
            "root" : "user",
            "path" : "user/community/users",
            "method" : "GET"
        },
        "tag.tag.popular" : {
            "root" : "tag",
            "path" : "tag_popular",
            "method" : "GET"
        },
        "anno.anno.archive" : {
            "root" : "anno",
            "path" : "anno/archive",
            "method" : "POST"
        }
    },
    borderColor : "#ff9900",
    deviceList : {
        "iPhone1,1": "iPhone",
        "iPhone1,2": "iPhone 3G",
        "iPhone2,1": "iPhone 3GS",
        "iPhone3,1": "iPhone 4",
        "iPhone3,2": "iPhone 4",
        "iPhone3,3": "iPhone 4",
        "iPhone4,1": "iPhone 4S",
        "iPhone5,1": "iPhone 5 GSM",
        "iPhone5,2": "iPhone 5 CDMA",
        "iPhone5,3": "iPhone 5C",
        "iPhone5,4": "iPhone 5C",
        "iPhone6,1": "iPhone 5S",
        "iPhone6,2": "iPhone 5S",
        "iPhone7,1": "iPhone 6Plus",
        "iPhone7,2": "iPhone 6",
        "iPod1,1": "iPod 1st Generation",
        "iPod2,1": "iPod 2nd Generation",
        "iPod3,1": "iPod 3rd Generation",
        "iPod4,1": "iPod 4th Generation",
        "iPod5,1": "iPod 5th Generation",
        "iPad1,1": "iPad 1st Generation",
        "iPad2,1": "iPad 2",
        "iPad2,2": "iPad 2",
        "iPad2,3": "iPad 2",
        "iPad2,4": "iPad 2",
        "iPad3,1": "iPad 3rd Generation",
        "iPad3,2": "iPad 3rd Generation",
        "iPad3,3": "iPad 3rd Generation",
        "iPad3,4": "iPad 4th Generation",
        "iPad3,5": "iPad 4th Generation",
        "iPad3,6": "iPad 4th Generation",
        "iPad4,1": "iPad Air",
        "iPad4,2": "iPad Air",
        "iPad4,3": "iPad Air",
        "iPad5,3": "iPad Air 2",
        "iPad5,4": "iPad Air 2",
        "iPad2,5": "iPad Mini 1st Generation",
        "iPad2,6": "iPad Mini 1st Generation",
        "iPad2,7": "iPad Mini 1st Generation",
        "iPad4,4": "iPad Mini 2",
        "iPad4,5": "iPad Mini 2",
        "iPad4,6": "iPad Mini 2",
        "iPad4,7": "iPad Mini 3",
        "iPad4,8": "iPad Mini 3",
        "iPad4,9": "iPad Mini 3"
    }
});
