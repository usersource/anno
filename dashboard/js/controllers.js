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

Dashboard.controller('Login', function($scope, $window, $location, $cookieStore, Utils, DashboardConstants, DataService) {
    $scope.initLogin = function() {
        // DataService.checkAuthentication();
    };

    $scope.authenticate_dashboard = function() {
        var params = {
            'user_email' : $scope.email,
            'password' : $scope.password,
            'team_key' : $scope.teamkey
        };

        DataService.makeHTTPCall("account.dashboard.authenticate", params, function(data) {
            data['email'] = params.user_email;
            Utils.storeUserDataInCookies(data);
            if (data.authenticated) {
                $window.location.href = $location.absUrl().replace('login.html', 'feed.html');
            }
        });
    };
});

Dashboard.controller('Feed', function($scope, $window, $location, $cookieStore, $sce, $timeout, Utils, DataService, ComStyleGetter, DashboardConstants, Autocomplete) {
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
        getCommunityUsers();
    };

    $scope.archiveAnno = function(event) {
        var anno_id = Utils.findAncestor(event.target, 'anno-item').dataset.annoId;
        DataService.makeHTTPCall("anno.anno.archive", {
            id : anno_id
        }, function(data) {
            var anno_item_data = Utils.getAnnoById($scope.annoList, anno_id);
            anno_item_data["archived"] = !(anno_item_data.archived);
        });
    };

    $scope.showLocalDateTime = function(datetime) {
        return new Date(datetime);
    };

    $scope.showProperDeviceName = function(device_model) {
        if (device_model in DashboardConstants.deviceList) {
            device_model = DashboardConstants.deviceList[device_model];
        }

        return device_model;
    };

    $scope.parseForTagsMentionsLinks = function(text, engaged_users) {
        text = Utils.replaceURLWithLink(text);
        text = Utils.replaceEmailWithName(text, engaged_users);
        text = Utils.replaceHashTagWithLink(text);
        text = $sce.trustAsHtml(text);
        return text;
    };

    $scope.watchersCount = function() {
        $timeout(function() {
            $scope.watchers = Utils.watchersContainedIn($scope);
            console.log("Number of watchers:", $scope.watchers);
        });
    };

    function getDashboardList() {
        DataService.makeHTTPCall("anno.anno.dashboard.list", {
            outcome : 'cursor,has_more,anno_list'
        }, function(data) {
            var newAnnoListData = data.anno_list;
            $scope.annoList = $scope.annoList || [];
            angular.forEach(newAnnoListData, function(anno) {
                anno.engaged_users = Utils.getUniqueEngagedUsers(anno, $scope.community_engaged_users, true) || [];
            });
            $scope.annoList = $scope.annoList.concat(newAnnoListData);
            getAppinfoData();
            getPopularTags();
            console.log("$scope.annoList:", $scope.annoList);
            $scope.watchersCount();
        }, function(status) {
            if (status == 401) {
                $window.location.href = $location.absUrl().replace('feed.html' , 'login.html');
                Utils.removeUserDataCookies();
            }
        });
    }

    function getAppinfoData() {
        DataService.makeHTTPCall("appinfo.appinfo.get", {
            team_key : $cookieStore.get('team_key')
        }, function(data) {
            $scope.appInfo = data;
        });
    }

    function getCommunityUsers() {
        DataService.makeHTTPCall("user.user.community.users", {
            account_type : $cookieStore.get('team_key')
        }, function(data) {
            $scope.community_engaged_users = Utils.getUniqueEngagedUsers(data.user_list, [], false) || [];
            getDashboardList();
        });
    }

    function getPopularTags() {
        DataService.makeHTTPCall("tag.tag.popular", {
            limit : 100
        }, function(data) {
            $scope.popularHashtags = 'tags' in data ? data.tags : [];
        });
    }

    $scope.screenshotLoad = function (event, anno_item) {
        if (event !== undefined) {
            anno_item = Utils.findAncestor(event.currentTarget, 'anno-item');
        }
        var imgDetailScreenshot = anno_item.querySelector(".imgDetailScreenshot");
        angular.element(imgDetailScreenshot).css('display', '');
        if ((imgDetailScreenshot.naturalWidth / imgDetailScreenshot.naturalHeight) > 1.0) {
            var anno_item_data = Utils.getAnnoById($scope.annoList, anno_item.dataset.annoId);
            anno_item_data.landscapeView = true;
            if (!anno_item_data.landscapeViewLoaded) {
                anno_item_data.landscapeViewLoaded = true;
                $timeout(function() {
                    $scope.screenshotLoad(undefined, anno_item);
                }, 0);
                return;
            }
        }

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
        var annoData = Utils.getAnnoById($scope.annoList, anno_id);
        var lineStrokeStyle = { color: DashboardConstants.borderColor, width: 3 };

        if (angular.isObject(annoData)) {
            var elementsObject = angular.fromJson(annoData.draw_elements);
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
            $scope.isTeamNotesEditing = true;
            teamNotesTextNode.style.display = "none";
            teamNotesTextInput.style.display = "block";
        } else {
            $scope.isTeamNotesEditing = false;
            teamNotesTextNode.style.display = "block";
            teamNotesTextInput.style.display = "none";
        }

        if (teamNotesTextNode.innerText !== $scope.noTeamNotesText) {
            var anno_item_data = Utils.getAnnoById($scope.annoList, anno_item.dataset.annoId);
            teamNotesTextInput.querySelector('textarea').value = Utils.replaceEmailWithName(anno_item_data.team_notes,
                                                                                            anno_item_data.engaged_users,
                                                                                            true);
        }
    };

    $scope.textareaKeydown = function(event, type) {
        if (event.keyCode === 13) {
            if (type === 'teamnotes') {
                $scope.saveTeamNotes(event);
            } else if (type === 'comment') {
                $scope.postComment(event);
            }
        } else {
            $timeout(function() {
                Autocomplete.typeahead(event, $scope.annoList, $scope.popularHashtags, function() {
                    $scope.currentEngagedUserList = Autocomplete.currentEngagedUserList;
                    $scope.currentHashtagList = Autocomplete.currentHashtagList;
                    $scope.$apply();
                });
            }, 0);
        }
    };

    $scope.selectSuggestion = Autocomplete.selectSuggestion;

    $scope.saveTeamNotes = function(event) {
        $scope.team_notes_save = "Saving...";
        var anno_item = Utils.findAncestor(event.currentTarget, 'anno-item'),
            teamNotesTextNode = anno_item.querySelector('.team-notes'),
            teamNotesTextInput = anno_item.querySelector('.anno-team-notes-edittext'),
            anno_id = anno_item.dataset.annoId;

        var teamNotes = teamNotesTextInput.querySelector('textarea').value.trim(),
            tagged_users = [],
            anno_item_data = Utils.getAnnoById($scope.annoList, anno_id);

        if (teamNotes.length) {
            var teamNotesData = Utils.replaceUniqueUserNameWithID(teamNotes, anno_item_data.engaged_users);
            teamNotes = teamNotesData[0];
            tagged_users = teamNotesData[1];
        }

        anno_item_data.team_notes = teamNotes;
        DataService.makeHTTPCall("anno.anno.teamnotes.insert", {
            id: anno_id,
            team_notes: teamNotes,
            tagged_users: tagged_users
        }, function(data) {
            if (!('team_notes_metadata' in anno_item_data)) {
                anno_item_data["team_notes_metadata"] = {};
            }

            anno_item_data["team_notes_metadata"]["tags"] = 'tags' in data ? data.tags : [];
            anno_item_data["team_notes_metadata"]["mentions"] = 'mentions' in data ? data.mentions : [];

            $scope.team_notes_save = "Saved";
            $scope.isTeamNotesEditing = false;
            $timeout(function() {
                teamNotesTextNode.style.display = "block";
                teamNotesTextInput.style.display = "none";
            }, 1000);
        });
    };

    $scope.postComment = function(event) {
        var anno_item = Utils.findAncestor(event.currentTarget, 'anno-item'),
            postCommentTextarea = anno_item.querySelector('.post-comment').querySelector('textarea'),
            anno_id = anno_item.dataset.annoId;

        var comment = postCommentTextarea.value.trim();
        if (comment.length) {
            var anno_item_data = Utils.getAnnoById($scope.annoList, anno_id);
            var commentData = Utils.replaceUniqueUserNameWithID(comment, anno_item_data.engaged_users);
            comment = commentData[0];
            DataService.makeHTTPCall("followup.followup.insert", {
                anno_id : anno_id,
                comment : comment,
                tagged_users : commentData[1]
            }, function(data) {
                postCommentTextarea.value = "";
                var latestComment = {
                    id : data.id,
                    anno_id : data.anno_id,
                    comment : data.comment,
                    created : data.created,
                    creator : data.creator
                };
                if (!('followup_list' in anno_item_data)) {
                    anno_item_data["followup_list"] = [];
                }
                anno_item_data.followup_list.unshift(latestComment);
            });
        }
    };
});
