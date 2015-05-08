'use strict';

var DashboardConstantsModule = angular.module('DashboardConstantsModule', []);

DashboardConstantsModule.value("DashboardConstants", {
    Stripe : {
        publishableKey : "pk_test_QkjAhTugzqHQClhlF7pX5r4F",
        name : "UserSource",
        plans: {
            pro: {
                title: "Pro Plan",
                price: "$50/month",
                description : "Pro Plan $50/month",
                amount : 5000
            },
            enterprise: {
                title: "Enterprise Plan",
                price: "$500/month",
                description : "Enterprise Plan $500/month",
                amount : 50000
            }
        }
    },
    filters : {
        "basic" : "basic",
        "myMentions" : "by_my_mentions",
        "mostPopular" : "by_vote_count",
        "mostFlagged" : "by_flag_count",
        "mostActive" : "by_activity_count",
        "archived" : "by_archived"
    },
    roleType : {
        "admin" : "admin"
    },
    apiRoot : "/_ah/api",
    imageURL : "/screenshot?anno_id=",
    endpointVersion: "1.0",
    endpointUrl : {
        "account.dashboard.authenticate" : {
            "root" : "account",
            "path" : "account/dashboard/authenticate",
            "method" : "POST"
        },
        "account.dashboard.teams" : {
            "root" : "account",
            "path" : "account/dashboard/teams",
            "method" : "GET"
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
        },
        "community.community.hash" : {
            "root" : "community",
            "path" : "community/hash",
            "method" : "GET"
        },
        "vote.vote.insert" : {
            "root" : "vote",
            "path" : "vote",
            "method" : "POST"
        },
        "vote.vote.delete" : {
            "root" : "vote",
            "path" : "vote",
            "method" : "DELETE"
        },
        "flag.flag.insert" : {
            "root" : "flag",
            "path" : "flag",
            "method" : "POST"
        },
        "flag.flag.delete" : {
            "root" : "flag",
            "path" : "flag",
            "method" : "DELETE"
        },
        "community.community.admin_master" : {
            "root" : "community",
            "path" : "community/admin_master_data",
            "method" : "GET"
        },
        "community.user.insert" : {
            "root" : "community",
            "path" : "user",
            "method" : "POST"
        },
        "community.user.update" : {
            "root" : "community",
            "path" : "user/update",
            "method" : "POST"
        },
        "community.community.circle.users.list" : {
            "root" : "community",
            "path" : "community/circle/users/list",
            "method" : "GET"
        },
        "community.teamsecret.reset" : {
            "root" : "community",
            "path" : "community/teamsecret/reset",
            "method" : "POST"
        },
        "community.community.update" : {
            "root" : "community",
            "path" : "community/update",
            "method" : "POST"
        },
        "community.teamkey.update" : {
            "root" : "community",
            "path" : "community/teamkey/update",
            "method" : "POST"
        },
        "community.appicon.update" : {
            "root" : "community",
            "path" : "community/appicon/update",
            "method" : "POST"
        },
        "community.community.create_sdk_community" : {
            "root" : "community",
            "path" : "community/create_sdk_community",
            "method" : "POST"
        },
        "appinfo.appinfo.get_by_name" : {
            "root" : "appinfo",
            "path" : "appinfo/get_by_name",
            "method" : "GET"
        },
        "community.create_sdk_community.pricing" : {
            "root" : "community",
            "path" : "community/create_sdk_community/pricing",
            "method" : "POST"
        },
        "community.plan.update" : {
            "root" : "community",
            "path" : "community/plan/update",
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
