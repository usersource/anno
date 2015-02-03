'use strict';

var Dashboard = angular.module('Dashboard', ['ngCookies', 'DashboardConstantsModule', 'DataServiceModule']);

Dashboard.config(['$httpProvider', function($httpProvider) {
    var $cookies;
    angular.injector(['ngCookies']).invoke(function(_$cookies_) {
        $cookies = _$cookies_;
    });

    var userTeamToken = angular.fromJson($cookies.user_team_token);
    if (userTeamToken != undefined) {
        $httpProvider.defaults.headers.common.Authorization = userTeamToken.token_type + ' ' + userTeamToken.access_token;
    }

    $httpProvider.defaults.headers.common.contentType = 'application/json';
}]);

Dashboard.controller('Login', function($scope, $cookieStore, DashboardConstants, DataService) {
    $scope.initLogin = function() {
        // DataService.checkAuthentication();
    };

    $scope.authenticate_dashboard = function() {
        var params = {
            'user_email' : $scope.email,
            'password' : $scope.password,
            'team_key' : $scope.teamkey
        };

        DataService.authenticateDashboard(params);
    };
});

Dashboard.controller('Feed', function($scope, $window, $location, $cookieStore, $sce, DataService, ComStyleGetter, DashboardConstants) {
    var noTeamNotesText = "No Notes";

    $scope.imageBaseURL = DashboardConstants.imageURL[DashboardConstants.serverURLKey];
    $scope.display_name = $cookieStore.get('user_display_name');
    $scope.email = $cookieStore.get('user_email');
    $scope.image_url = $cookieStore.get('user_image_url');

    $scope.showSignoutButton = "none";
    $scope.signoutArrowValue = false;

    $scope.imageWidth = 0;
    $scope.imageHeight = 0;
    $scope.borderWidth = 4;

    $scope.signoutButtonClicked = function() {
        if (logout_button.style.display === "none") {
            $scope.showSignoutButton = "block";
            $scope.signoutArrowValue = true;
        } else {
            $scope.showSignoutButton = "none";
            $scope.signoutArrowValue = false;
        }
    };

    $scope.signoutDashboard = function() {
        $window.location.href = $location.absUrl().replace('feed.html' , 'login.html');
        DataService.removeUserDataCookies();
    };

    $scope.initLogin = function() {
        // DataService.checkAuthentication();
    };

    DataService.getAppInfo($cookieStore.get('team_key'), function(data) {
        $scope.appInfo = data;
    });

    DataService.getAnnos(function(data, imageURL) {
        $scope.annoList = data.anno_list;
        console.log($scope.annoList);
        angular.forEach($scope.annoList, function(anno) {
            anno.upvote_text = anno.is_my_vote ? "Upvoted" : "Upvote";
            anno.flag_text = anno.is_my_flag ? "Flagged" : "Flag";

            anno.tags = [];
            anno.mentions = [];
            anno.teamNotesNotPresent = false;

            if (anno.device_model in DashboardConstants.deviceList) {
                anno.device_model = DashboardConstants.deviceList[anno.device_model];
            }

            if (anno.team_notes.length === 0) {
                anno.teamNotesNotPresent = true;
                anno.team_notes = noTeamNotesText;
            }

            angular.forEach(anno.followup_list, function(comment) {
                comment.modified_comment = comment.comment;
                comment.modified_comment = DataService.replaceURLWithLink(comment.modified_comment);
                comment.modified_comment = DataService.replaceEmailWithName(comment.modified_comment, comment.tagged_users_detail);
                comment.modified_comment = $sce.trustAsHtml(comment.modified_comment);
            });
        });
    });

    $scope.screenshotLoad = function (event) {
        var anno_index = Number(event.target.dataset.index);
        var imgDetailScreenshot = eval("anno_" + anno_index).querySelector(".imgDetailScreenshot");
        angular.element(imgDetailScreenshot).css('display', '');

        var self = this;
        require(["anno/draw/Surface"], function(Surface) {
            self.imageWidth = parseInt(ComStyleGetter.getComStyle(imgDetailScreenshot).width, 10);
            self.imageHeight = parseInt(ComStyleGetter.getComStyle(imgDetailScreenshot).height, 10);
            // self.borderWidth = Math.floor(self.imageWidth * 0.02);

            var surface = new Surface({
                container : document.getElementById('gfxCanvasContainer_' + anno_index),
                width : 500,
                height : 500,
                editable : false,
                borderWidth : 0
            });

            self.applyAnnoLevelColor(anno_index, imgDetailScreenshot);
            self.redrawShapes(anno_index, surface);
        });
    };

    $scope.applyAnnoLevelColor = function (anno_index, imgDetailScreenshot) {
        var screenshotContainer = eval("anno_" + anno_index).querySelector(".screenshotContainer");
        angular.element(screenshotContainer).css({
            width : (this.imageWidth - this.borderWidth * 2) + 'px',
            height : (this.imageHeight - this.borderWidth * 2) + 'px',
            'border-color' : DashboardConstants.borderColor,
            'border-style' : 'solid',
            'border-width' : this.borderWidth + 'px'
        });

        angular.element(imgDetailScreenshot).css({ width : '100%', height : '100%' });
    };

    $scope.redrawShapes = function(anno_index, surface) {
        var annoData = this.annoList[anno_index];
        var drawElements = annoData.draw_elements;
        var lineStrokeStyle = { color: DashboardConstants.borderColor, width: 3 };

        if (drawElements) {
            var elementsObject = angular.fromJson(drawElements);
            surface.show();
            angular.element(surface.container).css({'border': this.borderWidth + 'px solid transparent', left: '0px',top: '0px'});
            surface.borderWidth = this.borderWidth;
            surface.setDimensions(this.imageWidth - this.borderWidth * 2, this.imageHeight - this.borderWidth * 2);
            surface.parse(elementsObject, lineStrokeStyle);
        }
    };

    $scope.editTeamNotes = function(event) {
        var teamNotesParentNode = event.currentTarget.parentElement.parentElement,
            teamNotesTextNode = teamNotesParentNode.querySelector('.team-notes'),
            teamNotesTextInput = teamNotesParentNode.querySelector('.anno-team-notes-edittext');

        if (teamNotesTextNode.style.display !== "none") {
            teamNotesTextNode.style.display = "none";
            teamNotesTextInput.style.display = "block";
        } else {
            teamNotesTextNode.style.display = "block";
            teamNotesTextInput.style.display = "none";
        }

        if (teamNotesTextNode.innerText !== noTeamNotesText) {
            teamNotesTextInput.querySelector('textarea').value = teamNotesTextNode.innerText;
        }
    };
});
