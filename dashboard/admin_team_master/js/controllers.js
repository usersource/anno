'use strict';

var AdminTeamMaster = angular.module('AdminTeamMaster', ['AdminTeamMasterConstantsModule', 'ServiceModule']);

AdminTeamMaster.controller('Main', function($scope, $timeout, $location, DataService, AdminTeamMasterConstants) {
    $scope.communities = [];
    $scope.community_detail = {};
    $scope.createSDKTeamScreenVisible = false;
    $scope.addUserScreenVisible = false;

    function showAdminTeamMasterMessage(message, error_type) {
        $scope.error_message = message;
        $scope.admin_master_team_error_type = error_type || false;
        $timeout(function() {
            $scope.error_message = "";
        }, 5000);
    }

    $scope.initMain = function() {
        $scope.getAdminTeamMasterList();
    };

    $scope.getDashboardURL = function(community_name, team_hash) {
        if (community_name && team_hash) {
            var url = $location.protocol() + "://" + $location.host();
            if ($location.port() !== 443) {
                url = url + ":" + $location.port();
            }
            url = url + "/dashboard/" + team_hash + "/" + community_name.replace(/\W+/g, "-").toLowerCase();
            return url;
        } else {
            return "";
        }
    };

    $scope.showCreateSDKTeamScreen = function(state) {
        $scope.createSDKTeamScreenVisible = state;
    };

    $scope.showAddUserScreen = function(state) {
        $scope.user_role = "member";
        $scope.addUserScreenVisible = state;
    };

    $scope.createSDKTeam = function() {
        DataService.makeHTTPCall("community.community.create_sdk_community",{
            "community_name" : $scope.team_name,
            "app_name" : $scope.app_name,
            "team_key" : $scope.team_key,
            "admin_user" : {
                "user_email" : $scope.admin_email,
                "display_name" : $scope.admin_display_name,
                "password" : $scope.admin_password
            }
        }, function(data) {
            $scope.createSDKTeamScreenVisible = false;
            $scope.communities.push(data.communities[0]);
        }, function(status) {
        });
    };

    $scope.addUser = function() {
        DataService.makeHTTPCall("community.user.insert",{
            "team_key" : $scope.community_detail.team_key,
            "user_email" : $scope.user_email,
            "user_display_name" : $scope.user_display_name,
            "user_password" : $scope.user_password,
            "role" : $scope.user_role
        }, function(data) {
            $scope.addUserScreenVisible = false;
            $scope.community_detail.users.push({
                "user_email" : $scope.user_email,
                "display_name" : $scope.user_display_name,
                "password_present" : true,
                "role" : $scope.user_role,
                "circle" : $scope.community_detail.users[0].circle
            });
        }, function(status) {
        });
    };

    $scope.selectCommunity = function(event) {
        var team_key = event.currentTarget.dataset.teamKey;
        angular.element(document.getElementsByClassName("community")).removeClass("selected");
        angular.element(event.currentTarget).addClass("selected");
        $scope.community_detail = $scope.communities.filter(function(community) {
            return community.team_key === team_key;
        })[0];
    };

    $scope.getAdminTeamMasterList = function(event) {
        DataService.makeHTTPCall("community.community.admin_master", {
            "get_user_list" : true
        }, function(data) {
            if (data.hasOwnProperty('communities') && data.communities.length > 0) {
                $scope.communities = data.communities;
                $scope.community_detail = data.communities[0];
            }
        }, function(status) {
            showAdminTeamMasterMessage("Oops... Something went wrong while archiving. Please try again.", true);
        });
    };
});
