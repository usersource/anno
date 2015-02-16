'use strict';

var Dashboard = angular.module('Dashboard', ['ngCookies', 'ngRoute', 'DashboardConstantsModule', 'ServiceModule']);

Dashboard.config(['$httpProvider', function($httpProvider) {
    var $cookies;
    angular.injector(['ngCookies']).invoke(function(_$cookies_) {
        $cookies = _$cookies_;
    });

    var userTeamToken = angular.fromJson($cookies.user_team_token);
    if (angular.isDefined(userTeamToken)) {
        $httpProvider.defaults.headers.common.Authorization = userTeamToken.token_type + ' ' + userTeamToken.access_token;
    }

    $httpProvider.defaults.headers.common.contentType = 'application/json';
}]);

Dashboard.controller('Login', function($scope, $window, $location, $cookieStore, $timeout, Utils, DashboardConstants, DataService) {
    $scope.initLogin = function() {
        // DataService.checkAuthentication();
        var team_hash = $location.absUrl().split("/").reverse()[0];
        if (!angular.equals(team_hash, 'login')) {
            $scope.hideTeamKeyField = true;
            DataService.makeHTTPCall("community.community.hash", {
                team_hash : team_hash
            }, function(data) {
                $scope.teamkey = data.team_key;
            });
        }
    };

    $scope.authenticate_dashboard = function() {
        DataService.makeHTTPCall("account.dashboard.authenticate", {
            'user_email' : $scope.email,
            'password' : $scope.password,
            'team_key' : $scope.teamkey
        }, function(data) {
            data['email'] = $scope.email;
            if (data.authenticated) {
                Utils.storeUserDataInCookies(data);
                $window.location.href = $location.absUrl().replace(/(login.*)/g, 'feed');
            } else {
                $scope.error_message = "Authentication failed. Please try again.";
                document.querySelector('#dashboard_message').style.display = "block";
                $timeout(function() {
                    document.querySelector('#dashboard_message').style.display = "none";
                }, 5000);
            }
        });
    };
});

Dashboard.controller('Feed', function($scope, $window, $location, $cookieStore, $sce, $timeout, Utils, DataService, ComStyleGetter, DashboardConstants, Autocomplete) {
    var imageWidth = 0,
        imageHeight = 0,
        borderWidth = 4,
        firstTime = true;

    $scope.noTeamNotesText = "No Notes";
    $scope.imageBaseURL = DashboardConstants.imageURL[DashboardConstants.serverURLKey];
    $scope.display_name = $cookieStore.get('user_display_name');
    $scope.email = $cookieStore.get('user_email');
    $scope.image_url = $cookieStore.get('user_image_url');
    $scope.showSignoutButton = "none";
    $scope.signoutArrowValue = false;
    $scope.annoList = [];
    $scope.landscapeView = [];

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
        $window.location.href = $location.absUrl().replace('feed' , 'login');
        Utils.removeUserDataCookies();
    };

    $scope.initFeed = function() {
        // DataService.checkAuthentication();
        getDashboardList(DashboardConstants.filters.basic, true);
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
        if (DashboardConstants.deviceList.hasOwnProperty(device_model)) {
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

    $scope.filterAnno = function(event) {
        var query_type = DashboardConstants.filters[event.target.dataset.type];
        if (angular.equals(query_type, $scope.filterType)) {
            query_type = DashboardConstants.filters.basic;
        }
        getDashboardList(query_type, true);
    };

    function watchersCount() {
        $timeout(function() {
            $scope.watchers = Utils.watchersContainedIn($scope);
            console.log("Number of watchers:", $scope.watchers);
        }, 10000);
    };

    function getDashboardList(query_type, clear_anno) {
        $scope.filterType = query_type;
        DataService.makeHTTPCall("anno.anno.dashboard.list", {
            outcome : 'cursor,has_more,anno_list',
            query_type : $scope.filterType
        }, function(data) {
            if (clear_anno) {
                $scope.annoList = [];
            }
            var newAnnoData = data.hasOwnProperty('anno_list') ? data.anno_list : [];
            if ($scope.hasOwnProperty('community_engaged_users') && $scope.community_engaged_users.length) {
                angular.forEach(newAnnoData, function(anno) {
                    anno.engaged_users = Utils.getUniqueEngagedUsers(anno, $scope.community_engaged_users, true) || [];
                });
            }
            $scope.annoList = $scope.annoList.concat(newAnnoData);
            console.log("$scope.annoList:", $scope.annoList);
            if (firstTime) {
                firstTime = false;
                $timeout(function() {
                    getAppinfoData();
                    getPopularTags();
                    getCommunityUsers();
                    watchersCount();
                }, 1000);
            }
        }, function(status) {
            if (status == 401) {
                $window.location.href = $location.absUrl().replace('feed' , 'login');
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
            angular.forEach($scope.annoList, function(anno) {
                anno.engaged_users = Utils.getUniqueEngagedUsers(anno, $scope.community_engaged_users, true) || [];
            });
        });
    }

    function getPopularTags() {
        DataService.makeHTTPCall("tag.tag.popular", {
            limit : 100
        }, function(data) {
            $scope.popularHashtags = data.hasOwnProperty('tags') ? data.tags : [];
        });
    }

    $scope.screenshotLoad = function (event, anno_item) {
        if (angular.isDefined(event)) {
            anno_item = Utils.findAncestor(event.currentTarget, 'anno-item');
        }
        var imgDetailScreenshot = anno_item.querySelector(".imgDetailScreenshot");
        angular.element(imgDetailScreenshot).css('display', '');
        if ((imgDetailScreenshot.naturalWidth / imgDetailScreenshot.naturalHeight) > 1.0) {
            var anno_id = anno_item.dataset.annoId,
                anno_item_data = Utils.getAnnoById($scope.annoList, anno_id);

            if (angular.equals($scope.landscapeView.indexOf(anno_id), -1)) {
                $scope.landscapeView.push(anno_id);
            }
            if (!anno_item_data.landscapeViewLoaded) {
                anno_item_data.landscapeViewLoaded = true;
                $timeout(function() {
                    $scope.screenshotLoad(undefined, anno_item);
                });
                return;
            }
        }

        var self = this;
        require(["anno/draw/Surface"], function(Surface) {
            imageWidth = parseInt(ComStyleGetter.getComStyle(imgDetailScreenshot).width, 10);
            imageHeight = parseInt(ComStyleGetter.getComStyle(imgDetailScreenshot).height, 10);
            // borderWidth = Math.floor(self.imageWidth * 0.02);

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
            width : (imageWidth - borderWidth * 2) + 'px',
            height : (imageHeight - borderWidth * 2) + 'px',
            'border-color' : DashboardConstants.borderColor,
            'border-style' : 'solid',
            'border-width' : borderWidth + 'px'
        });

        angular.element(imgDetailScreenshot).css({ width : '100%', height : '100%' });
    };

    $scope.redrawShapes = function(anno_id, surface) {
        var annoData = Utils.getAnnoById($scope.annoList, anno_id);
        var lineStrokeStyle = { color: DashboardConstants.borderColor, width: 3 };

        if (angular.isObject(annoData)) {
            var elementsObject = angular.fromJson(annoData.draw_elements);
            surface.show();
            angular.element(surface.container).css({'border': borderWidth + 'px solid transparent', left: '0px',top: '0px'});
            surface.borderWidth = borderWidth;
            surface.setDimensions(imageWidth - borderWidth * 2, imageHeight - borderWidth * 2);
            surface.parse(elementsObject, lineStrokeStyle);
        }
    };

    $scope.editTeamNotes = function(event) {
        Autocomplete.clearSuggestion();
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
        Autocomplete.clearSuggestion();
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
            if (!anno_item_data.hasOwnProperty('team_notes_metadata')) {
                anno_item_data["team_notes_metadata"] = {};
            }

            anno_item_data["team_notes_metadata"]["tags"] = data.hasOwnProperty('tags') ? data.tags : [];
            anno_item_data["team_notes_metadata"]["mentions"] = data.hasOwnProperty('mentions') ? data.mentions : [];

            $scope.team_notes_save = "Saved";
            $scope.isTeamNotesEditing = false;
            $timeout(function() {
                teamNotesTextNode.style.display = "block";
                teamNotesTextInput.style.display = "none";
            }, 1000);
        });
    };

    $scope.postComment = function(event) {
        Autocomplete.clearSuggestion();
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
                if (!anno_item_data.hasOwnProperty('followup_list')) {
                    anno_item_data["followup_list"] = [];
                }
                anno_item_data.followup_list.unshift(latestComment);
            });
        }
    };
});
