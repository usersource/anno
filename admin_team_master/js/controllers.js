'use strict';

var AdminTeamMaster = angular.module('AdminTeamMaster', ['AdminTeamMasterConstantsModule', 'ServiceModule']);

AdminTeamMaster.controller('Main', function($scope, $timeout, $location, DataService, AdminTeamMasterConstants) {
    $scope.communities = [];
    $scope.community_detail = {};

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
            if ($location.port() !== "80") {
                url = url + ":" + $location.port();
            }
            url = url + "/dashboard/" + team_hash + "/" + community_name.replace(/\W+/g, "-").toLowerCase();
            return url;
        } else {
            return "";
        }
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
