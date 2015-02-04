'use strict';

var Dashboard = angular.module('Dashboard', ['ngCookies', 'DashboardConstantsModule', 'ServiceModule']);

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

Dashboard.controller('Feed', function($scope, $window, $location, $cookieStore, $sce, Utils, DataService, ComStyleGetter, DashboardConstants) {
    $scope.noTeamNotesText = "No Notes";

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
        Utils.removeUserDataCookies();
    };

    $scope.initLogin = function() {
        // DataService.checkAuthentication();
    };

    DataService.getAppInfo($cookieStore.get('team_key'), function(data) {
        $scope.appInfo = data;
    });

    $scope.showLocalDateTime = function(datetime) {
        return new Date(datetime);
    };

    $scope.showProperDeviceName = function(device_model) {
        if (device_model in DashboardConstants.deviceList) {
            device_model = DashboardConstants.deviceList[device_model];
        }

        return device_model;
    };

    $scope.parseComment = function(comment, tagged_users_detail) {
        comment = Utils.replaceURLWithLink(comment);
        comment = Utils.replaceEmailWithName(comment, tagged_users_detail);
        comment = $sce.trustAsHtml(comment);
        return comment;
    };

    DataService.getAnnos(function(data, imageURL) {
        $scope.annoList = data.anno_list;
        console.log($scope.annoList);
    });

    $scope.screenshotLoad = function (event) {
        var anno_item = Utils.findAncestor(event.currentTarget, 'anno-item');
        var imgDetailScreenshot = anno_item.querySelector(".imgDetailScreenshot");
        angular.element(imgDetailScreenshot).css('display', '');

        var self = this;
        require(["anno/draw/Surface"], function(Surface) {
            self.imageWidth = parseInt(ComStyleGetter.getComStyle(imgDetailScreenshot).width, 10);
            self.imageHeight = parseInt(ComStyleGetter.getComStyle(imgDetailScreenshot).height, 10);
            // self.borderWidth = Math.floor(self.imageWidth * 0.02);

            var surface = new Surface({
                container : anno_item.querySelector(".gfxCanvasContainer"),
                width : 500,
                height : 500,
                editable : false,
                borderWidth : 0
            });

            self.applyAnnoLevelColor(anno_item, imgDetailScreenshot);
            self.redrawShapes(anno_item.dataset.annoId, surface);
        });
    };

    $scope.applyAnnoLevelColor = function (anno_item, imgDetailScreenshot) {
        var screenshotContainer = anno_item.querySelector(".screenshotContainer");
        angular.element(screenshotContainer).css({
            width : (this.imageWidth - this.borderWidth * 2) + 'px',
            height : (this.imageHeight - this.borderWidth * 2) + 'px',
            'border-color' : DashboardConstants.borderColor,
            'border-style' : 'solid',
            'border-width' : this.borderWidth + 'px'
        });

        angular.element(imgDetailScreenshot).css({ width : '100%', height : '100%' });
    };

    $scope.redrawShapes = function(anno_id, surface) {
        var annoData = this.annoList.filter(function(anno) { return anno.id == anno_id; })[0];
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
        $scope.team_notes_save = "Save";
        var anno_item = Utils.findAncestor(event.currentTarget, 'anno-item'),
            teamNotesTextNode = anno_item.querySelector('.team-notes'),
            teamNotesTextInput = anno_item.querySelector('.anno-team-notes-edittext');

        if (teamNotesTextNode.style.display !== "none") {
            teamNotesTextNode.style.display = "none";
            teamNotesTextInput.style.display = "block";
        } else {
            teamNotesTextNode.style.display = "block";
            teamNotesTextInput.style.display = "none";
        }

        if (teamNotesTextNode.innerText !== $scope.noTeamNotesText) {
            teamNotesTextInput.querySelector('textarea').value = teamNotesTextNode.innerText;
        }
    };

    $scope.saveTeamNotes = function(event) {
        $scope.team_notes_save = "Saving...";
        var anno_item = Utils.findAncestor(event.currentTarget, 'anno-item'),
            teamNotesTextNode = anno_item.querySelector('.team-notes'),
            teamNotesTextInput = anno_item.querySelector('.anno-team-notes-edittext');

        var teamNotes = teamNotesTextInput.querySelector('textarea').value.trim();
        if (teamNotes.length) {
            teamNotesTextNode.innerText = teamNotes;
            DataService.insertTeamNotes(anno_item.dataset.annoId, teamNotes, function() {
                $scope.team_notes_save = "Saved";
                setTimeout(function() {
                    teamNotesTextNode.style.display = "block";
                    teamNotesTextInput.style.display = "none";
                }, 1000);
            });
        }
    };
});
