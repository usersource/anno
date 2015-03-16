'use strict';

var AdminTeamMaster = angular.module('AdminTeamMaster', ['AdminTeamMasterConstantsModule', 'ServiceModule']);

AdminTeamMaster.controller('Main', function($scope, $timeout, DataService, AdminTeamMasterConstants) {
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

    $scope.getAdminTeamMasterList = function(event) {
        DataService.makeHTTPCall("community.community.admin_master", {
        }, function(data) {
        }, function(status) {
            showAdminTeamMasterMessage("Oops... Something went wrong while archiving. Please try again.", true);
        });
    };
});
