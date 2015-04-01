'use strict';

var Dashboard = angular.module('Dashboard', ['ngCookies', 'ngRoute', 'DashboardConstantsModule', 'ServiceModule']);

Dashboard.controller('Login', function($scope, $location, $timeout, $routeParams, Utils, DashboardConstants, DataService) {
    var team_hash = $routeParams.teamHash, team_name = $routeParams.teamName;
    var urlSearchParams = $location.search(), redirectTo;

    if ($cookies.hasOwnProperty('redirect_to')) {
        redirectTo = $cookies["redirect_to"];
        if (Utils.getRoutePath(redirectTo) === "login") {
            redirectTo = undefined;
        }
    }

    $scope.initLogin = function() {
        if (angular.isDefined(team_hash)) {
            $scope.hideTeamKeyField = true;
            DataService.makeHTTPCall("community.community.hash", {
                team_hash : team_hash
            }, function(data) {
                $scope.teamkey = data.team_key;
                $scope.appname = data.hasOwnProperty('app_name') ? data.app_name : '';
                $scope.appicon = data.hasOwnProperty('app_icon') ? data.app_icon : '';
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
                if (angular.isDefined(redirectTo)) {
                    Utils.removeRedirectURL();
                    window.location = decodeURIComponent(redirectTo).replace(/"/g, '');
                } else {
                    if (angular.isDefined(team_hash)) {
                        $location.path('/dashboard/' + team_hash + '/' + team_name + '/feed');
                    } else {
                        $location.path('/dashboard/feed');
                    }
                }
            } else {
                $scope.error_message = "Authentication failed. Please try again.";
                $scope.dashboard_error_type = true;
                $timeout(function() {
                    $scope.error_message = "";
                    $scope.dashboard_error_type = false;
                }, 5000);
            }
        });
    };
});

Dashboard.controller('Header', function($scope, $cookieStore, $location, $routeParams, Utils, DataService) {
    var team_hash = $routeParams.teamHash,
        team_name = $routeParams.teamName,
        team_key = $cookieStore.get('team_key');

    $scope.display_name = $cookieStore.get('user_display_name');
    $scope.email = $cookieStore.get('user_email');
    $scope.image_url = $cookieStore.get('user_image_url');
    $scope.showSignoutButton = "none";
    $scope.signoutArrowValue = false;
    $scope.currentSection = $location.path().split("/").reverse()[0];

    $scope.initHeader = function() {
        getAppinfoData();
    };

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
        Utils.removeUserDataCookies();
        $scope.selectSection('login');
    };

    function getAppinfoData() {
        DataService.makeHTTPCall("appinfo.appinfo.get", {
            team_key : team_key
        }, function(data) {
            $scope.appInfo = data;
        });
    }

    $scope.selectSection = function(sectionName) {
        if (angular.isDefined(team_hash) && angular.isDefined(team_name)) {
            $location.path('/dashboard/' + team_hash + '/' + team_name + '/' + sectionName);
        } else {
            $location.path('/dashboard/' + sectionName);
        }
    };
});

Dashboard.controller('Feed', function($scope, $location, $cookieStore, $sce, $timeout, $routeParams, $http, Utils, DataService, ComStyleGetter, DashboardConstants, Autocomplete) {
    var LOOK_AHEAD = 500;
    var team_hash = $routeParams.teamHash,
        team_name = $routeParams.teamName,
        param_anno_id = $routeParams.annoId,
        team_key = $cookieStore.get('team_key');

    var hasMore, annoItemCursor, surfaces = {};

    var imageWidth = 0,
        imageHeight = 0,
        borderWidth = 4,
        firstTime = true,
        oldScrollTop = 0;

    $scope.noTeamNotesText = "No Notes. You can use #hashtags and @mentions here.";
    $scope.imageBaseURL = DashboardConstants.imageURL;
    $scope.annoList = [];
    $scope.landscapeView = [];
    $scope.fetchingAnnos = false;
    $scope.singleAnnoMode = angular.isDefined(param_anno_id) ? true : false;

    function showDashboardMessage(message, error_type) {
        $scope.error_message = message;
        $scope.dashboard_error_type = error_type || false;
        $timeout(function() {
            $scope.error_message = "";
        }, 5000);
    }

    function showConfirmBox(title, text, onSuccess, onCancel) {
        $scope.showConfirmBox = true;
        $scope.confirm_box_title = title;
        $scope.confirm_box_text = text;

        $scope.confirmYesClicked = function(event) {
            $scope.showConfirmBox = false;
            if (angular.isDefined(onSuccess) && angular.isFunction(onSuccess)) {
                onSuccess();
            }
        };

        $scope.confirmNoClicked = function(event) {
            $scope.showConfirmBox = false;
            if (angular.isDefined(onCancel) && angular.isFunction(onCancel)) {
                onCancel();
            }
        };
    }

    $scope.getMoreAnnos = function() {
        if (!hasMore) return;
        if ($scope.fetchingAnnos || firstTime) return;
        if (oldScrollTop > annos.scrollTop) return;
        if ($scope.singleAnnoMode) return;
        oldScrollTop = annos.scrollTop;
        if ((annos.scrollHeight - annos.scrollTop) < (annos.getBoundingClientRect().height + LOOK_AHEAD)) {
            $scope.fetchingAnnos = true;
            getDashboardList($scope.filterType, false);
        }
    };

    $scope.initFeed = function() {
        var userTeamToken = angular.fromJson($cookieStore.get('user_team_token'));
        if (angular.isDefined(userTeamToken)) {
            $http.defaults.headers.common.Authorization = userTeamToken.token_type + ' ' + userTeamToken.access_token;
        }
        getDashboardList(DashboardConstants.filters.basic, true);
    };

    $scope.upvoteAnno = function(event) {
        var anno_id = Utils.findAncestor(event.target, 'anno-item').dataset.annoId,
            anno_item_data = Utils.getAnnoById($scope.annoList, anno_id);

        if (!anno_item_data.is_my_flag) {
            if (!anno_item_data.is_my_vote) {
                DataService.makeHTTPCall("vote.vote.insert", { anno_id : anno_id });
                anno_item_data.is_my_vote = true;
                anno_item_data.vote_count = String(Number(anno_item_data.vote_count) + 1);
            } else {
                DataService.makeHTTPCall("vote.vote.delete", { anno_id : anno_id });
                anno_item_data.is_my_vote = false;
                anno_item_data.vote_count = String(Number(anno_item_data.vote_count) - 1);
            }
        } else {
            showDashboardMessage("Sorry, you can't upvote as you have already flagged this.", true);
        }
    };

    $scope.flagAnno = function(event) {
        var anno_id = Utils.findAncestor(event.target, 'anno-item').dataset.annoId,
            anno_item_data = Utils.getAnnoById($scope.annoList, anno_id);

        if (!anno_item_data.is_my_vote) {
            if (!anno_item_data.is_my_flag) {
                DataService.makeHTTPCall("flag.flag.insert", { anno_id : anno_id });
                anno_item_data.is_my_flag = true;
                anno_item_data.flag_count = String(Number(anno_item_data.flag_count) + 1);
            } else {
                DataService.makeHTTPCall("flag.flag.delete", { anno_id : anno_id });
                anno_item_data.is_my_flag = false;
                anno_item_data.flag_count = String(Number(anno_item_data.flag_count) - 1);
            }
        } else {
            showDashboardMessage("Sorry, you can't flag as you have already upvoted this.", true);
        }
    };

    $scope.archiveAnno = function(event) {
        var anno_id = Utils.findAncestor(event.target, 'anno-item').dataset.annoId,
            anno_item_data = Utils.getAnnoById($scope.annoList, anno_id);

        function onArchiveAnno() {
            anno_item_data.archived = !(anno_item_data.archived);
            DataService.makeHTTPCall("anno.anno.archive", {
                id : anno_id
            }, function(data) {
                var message = "Item archived successfully.";
                if (!anno_item_data.archived) {
                    message = "Item unarchived successfully.";
                }
                showDashboardMessage(message);
            }, function(status) {
                anno_item_data.archived = !(anno_item_data.archived);
                showDashboardMessage("Oops... Something went wrong while archiving. Please try again.", true);
            });
        }

        var title = "Archive Anno",
            text = "You can unarchive this item from list after applying 'Archive' filter later.",
            onSuccess = function() { onArchiveAnno(); };

        if (anno_item_data.archived) {
            title = "Unarchive Anno";
            text = "You can archive this item from list later.";
        }

        showConfirmBox(title, text, onSuccess);
    };

    $scope.shareAnno = function(event) {
        var anno_id = Utils.findAncestor(event.target, 'anno-item').dataset.annoId,
            anno_item_data = Utils.getAnnoById($scope.annoList, anno_id);

        $scope.anno_share_url = $location.absUrl() + "/" + anno_item_data.id;
        $scope.showShareBox = true;
    };

    $scope.closeShareBox = function() {
        $scope.showShareBox = false;
    };

    $scope.focusShareBox = function() {
        dashboard_share_box_text.setSelectionRange(0, dashboard_share_box_text.value.length);
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

    $scope.getTrustedHtml = function(text) {
        return $sce.trustAsHtml(text);
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
        }, 1000);
    };

    function getMentionsList(anno) {
        anno.mentions_list = [];
        if (anno.hasOwnProperty('team_notes_metadata')) {
            if (anno['team_notes_metadata'].hasOwnProperty('mentions')) {
                anno.mentions_list = anno.mentions_list.concat(anno.team_notes_metadata.mentions);
            }
        }

        angular.forEach(anno.followup_list, function(followup) {
            if (followup.hasOwnProperty('tagged_users_detail')) {
                anno.mentions_list = anno.mentions_list.concat(followup.tagged_users_detail);
            }
        });

        anno.mentions_list = Utils.getUniqueData(anno.mentions_list, 'user_email');
        return anno;
    }

    function getDashboardList(query_type, clear_anno) {
        $scope.filterType = query_type;
        var args = {
            outcome : 'cursor,has_more,anno_list',
            query_type : $scope.filterType
        };

        if (clear_anno) annoItemCursor = "";
        if (annoItemCursor && annoItemCursor.length) args.cursor = annoItemCursor;
        if ($scope.singleAnnoMode) args.anno_id = param_anno_id;

        DataService.makeHTTPCall("anno.anno.dashboard.list", args, function(data) {
            if (clear_anno) {
                $scope.annoList = [];
                annos.scrollTop = 0;
            }

            var newAnnoData = data.hasOwnProperty('anno_list') ? data.anno_list : [];
            angular.forEach(newAnnoData, function(anno) {
                anno = getMentionsList(anno);
                anno["showingAnnotations"] = true;

                if ($scope.hasOwnProperty('community_engaged_users') && $scope.community_engaged_users.length) {
                    anno.engaged_users = Utils.getUniqueEngagedUsers(anno, $scope.community_engaged_users, true) || [];
                }
            });

            $scope.annoList = $scope.annoList.concat(newAnnoData);
            hasMore = data.hasOwnProperty('has_more') ? data.has_more : false;
            annoItemCursor = data.hasOwnProperty('cursor') ? data.cursor : "";
            // console.log("$scope.annoList:", $scope.annoList);

            if (firstTime) {
                firstTime = false;
                $timeout(function() {
                    getPopularTags();
                    getCommunityUsers();
                }, 1000);
            } else {
                $scope.fetchingAnnos = false;
            }

            $timeout(function() {
                if (angular.isDefined(annos)) {
                    var lastAnnoItem = annos.querySelector('.anno-item:last-child');
                    if (lastAnnoItem) {
                        LOOK_AHEAD = lastAnnoItem.getBoundingClientRect().height;
                    }
                }
            });

            watchersCount();
        }, function(status) {
            if (status == 401) {
                $scope.signoutDashboard();
            }
        });
    }

    function getCommunityUsers() {
        DataService.makeHTTPCall("user.user.community.users", {
            account_type : team_key
        }, function(data) {
            if (data.hasOwnProperty('user_list')) {
                $scope.community_engaged_users = Utils.getUniqueEngagedUsers(data.user_list, [], false) || [];
                angular.forEach($scope.annoList, function(anno) {
                    anno.engaged_users = Utils.getUniqueEngagedUsers(anno, $scope.community_engaged_users, true) || [];
                });
            }
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
        var anno_id = anno_item.dataset.annoId;
        angular.element(imgDetailScreenshot).css('display', '');
        if ((imgDetailScreenshot.naturalWidth / imgDetailScreenshot.naturalHeight) > 1.0) {
            var anno_item_data = Utils.getAnnoById($scope.annoList, anno_id);

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
            surfaces[anno_id] = surface;
        });
    };

    $scope.toggleAnnotation = function(event) {
        var anno_id = Utils.findAncestor(event.target, 'anno-item').dataset.annoId,
            anno_item_data = Utils.getAnnoById($scope.annoList, anno_id),
            surface = surfaces[anno_id];

        if (anno_item_data.showingAnnotations) {
            anno_item_data.showingAnnotations = false;
            surface.hide();
        } else {
            anno_item_data.showingAnnotations = true;
            surface.show();
        }
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
            anno_item_data = Utils.getAnnoById($scope.annoList, anno_id),
            old_team_notes = anno_item_data.team_notes;

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
            anno_item_data = getMentionsList(anno_item_data);

            $scope.team_notes_save = "Saved";
            $scope.isTeamNotesEditing = false;
            $timeout(function() {
                teamNotesTextNode.style.display = "block";
                teamNotesTextInput.style.display = "none";
            }, 1000);
        }, function(status) {
            anno_item_data.team_notes = old_team_notes;
            $scope.isTeamNotesEditing = false;
            teamNotesTextNode.style.display = "block";
            teamNotesTextInput.style.display = "none";
            showDashboardMessage("Oops... Something went wrong while saving team notes. Please try again.", true);
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
                if (!anno_item_data.hasOwnProperty('followup_list')) {
                    anno_item_data["followup_list"] = [];
                }
                anno_item_data.followup_list.unshift(data);
                anno_item_data = getMentionsList(anno_item_data);
            });
        }
    };
});

Dashboard.controller('Account', function($scope, $timeout, $location, $cookieStore, DataService, DashboardConstants) {
    var team_key = $cookieStore.get('team_key');

    $scope.communities = [];
    $scope.community_detail = {};

    function showDashboardMessage(message, error_type) {
        $scope.error_message = message;
        $scope.dashboard_error_type = error_type || false;
        $timeout(function() {
            $scope.error_message = "";
        }, 5000);
    }

    $scope.initManage = function() {
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

    $scope.getAdminTeamMasterList = function(event) {
        DataService.makeHTTPCall("community.community.admin_master", {
            "team_key" : team_key
        }, function(data) {
            if (data.hasOwnProperty('communities') && data.communities.length > 0) {
                $scope.communities = data.communities;
                $scope.community_detail = data.communities[0];
            }
        }, function(status) {
            showDashboardMessage("Oops... Something went wrong. Please try again.", true);
        });
    };
});

Dashboard.controller('Members', function($scope, $timeout, $location, $cookieStore, DataService, DashboardConstants) {
    var team_key = $cookieStore.get('team_key');

    $scope.circles = [];
    $scope.roles = [];
    $scope.current_circle = [];
    $scope.addMemberScreenVisible = false;

    function showDashboardMessage(message, error_type) {
        $scope.error_message = message;
        $scope.dashboard_error_type = error_type || false;
        $timeout(function() {
            $scope.error_message = "";
        }, 5000);
    }

    $scope.initMembers = function() {
        $scope.getCircleMembersList();
    };

    $scope.showAddMemberScreen = function(state) {
        $scope.user_role = $scope.roles[0];
        $scope.user_circle = $scope.circles[0].circle_name;
        $scope.addMemberScreenVisible = state;
    };

    $scope.addMember = function() {
        DataService.makeHTTPCall("community.user.insert",{
            "team_key" : team_key,
            "user_email" : $scope.user_email,
            "user_display_name" : $scope.user_display_name,
            "user_password" : $scope.user_password,
            "user_image_url" : $scope.user_image_url,
            "role" : $scope.user_role,
            "circle" : $scope.user_circle
        }, function(data) {
            $scope.addMemberScreenVisible = false;
            showDashboardMessage("'" + $scope.user_display_name + "' is added to team.");
            angular.forEach($scope.circles, function(circle) {
                if (circle.circle_name === $scope.user_circle) {
                    var new_member = {
                        "user_email" : $scope.user_email,
                        "display_name" : $scope.user_display_name,
                        "password_present" : true,
                        "image_url" : $scope.user_image_url,
                        "role" : $scope.user_role
                    };

                    if (circle.users.length) {
                        circle.users.push(new_member);
                    } else {
                        circle.users = Array(new_member);
                    }
                }
            });
            clearState();
        }, function(status) {
        });
    };

    function clearState() {
        $scope.user_email = "";
        $scope.user_display_name = "";
        $scope.user_password = "";
        $scope.user_image_url = "";
    }

    $scope.getCircleMembersList = function(event) {
        DataService.makeHTTPCall("community.community.circle.users.list", {
            "team_key" : team_key
        }, function(data) {
            if (data.hasOwnProperty('circle_list') && data.circle_list.length > 0) {
                $scope.circles = data.circle_list;
                $scope.current_circle = data.circle_list[0];
                $scope.selectCircle = $scope.current_circle.circle_name;
            }

            if (data.hasOwnProperty('roles') && data.roles.length > 0) {
                $scope.roles = data.roles;
            }
        }, function(status) {
            showDashboardMessage("Oops... Something went wrong. Please try again.", true);
        });
    };

    $scope.changeCircle = function(event) {
        $scope.current_circle = $scope.circles.filter(function(circle) {
            return circle.circle_name === $scope.selectCircle;
        })[0];
    };
});

Dashboard.controller('GetStarted', function($scope) {});
