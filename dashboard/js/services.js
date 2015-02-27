'use strict';

String.prototype.replaceAt = function(startIndex, replaceCount, character) {
    return this.substr(0, startIndex) + character + this.substr(startIndex + replaceCount);
};

var ServiceModule = angular.module('ServiceModule', ['ngCookies', 'DashboardConstantsModule']);

ServiceModule.factory('Utils', function($cookieStore) {
    function storeUserDataInCookies(data) {
        $cookieStore.put('authenticated', data.authenticated);
        $cookieStore.put('user_display_name', data.display_name);
        $cookieStore.put('user_email', data.email);
        $cookieStore.put('user_image_url', data.image_url);
        $cookieStore.put('team_key', data.team_key);
        $cookieStore.put('team_name', data.team_name);
        $cookieStore.put('user_team_token', angular.fromJson(data.user_team_token));
    }

    function removeUserDataCookies() {
        $cookieStore.put('authenticated', false);
        $cookieStore.remove('user_display_name');
        $cookieStore.remove('user_email');
        $cookieStore.remove('user_image_url');
        $cookieStore.remove('team_key');
        $cookieStore.remove('team_name');
        $cookieStore.remove('user_team_token');
    }

    function replaceURLWithLink(s) {
        var commentURLTemplate = '$1<a class="url" href="$2" target="_blank">$2</a>';
        s = s.replace(/(^|\W)\b((www\d{0,3}[.])(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig, "$1http://$2");
        return s.replace(/(^|\W)\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig, commentURLTemplate);
    }

    function replaceUniqueUserNameWithID(s, engaged_users) {
        engaged_users = engaged_users || [];

        var taggedUniqueName = s.match(/(^|\W)(@[a-z\d][\w]*)/ig) || [],
            taggedUserIDs = [];

        angular.forEach(taggedUniqueName, function(name) {
            name = name.trim();
            var filteredUser = engaged_users.filter(function(user) {
                return user.unique_name === name.split("@")[1];
            });
            if (filteredUser.length) {
                var userID = filteredUser[0]["id"];
                s = s.replace(name, "__" + userID + "__");
                if (taggedUserIDs.indexOf(userID) === -1) {
                    taggedUserIDs.push(userID);
                }
            }
        });

        return [s, taggedUserIDs];
    }

    function replaceEmailWithName(s, engaged_users, editMode) {
        engaged_users = engaged_users || [];

        var matchedEmailList = s.match(/(^|\W)(__[a-z\d][\w]*)/ig) || [];
        angular.forEach(matchedEmailList, function(id) {
            id = id.trim();
            var filteredUser = engaged_users.filter(function(user) {
                return user.id === id.split("__")[1];
            });
            if (filteredUser.length) {
                if (editMode) {
                    var userUniqueName = filteredUser[0]["unique_name"];
                    s = s.replace(id, "@" + userUniqueName);
                } else {
                    var userDisplayName = filteredUser[0]["display_name"],
                        userEmail = filteredUser[0]["user_email"];
                    s = s.replace(id, "<span class='tagged-user' title='" + userEmail + "'>" + userDisplayName + "</span>");
                }
            }
        });

        return s;
    }

    function replaceHashTagWithLink(s) {
        var linkScript = '$1<span class="hashtag">$2</span>';
        return s.replace(/(^|\W)(#[a-z\d][\w-]*)/ig, linkScript);
    }

    function findAncestor(el, cls) {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    }

    function getUniqueEngagedUsers(anno, teamUsers, perAnnoEngagedUsers) {
        var uniqueNames = [], uniqueUserName, engagedUsers;

        if (perAnnoEngagedUsers) {
            engagedUsers = [];
            if (angular.isObject(anno)) {
                if (anno.hasOwnProperty('engaged_users')) {
                    engagedUsers = engagedUsers.concat(anno.engaged_users);
                }
                if (anno.hasOwnProperty('team_notes_metadata')) {
                    if (anno.team_notes_metadata.hasOwnProperty('mentions')) {
                        engagedUsers = engagedUsers.concat(anno.team_notes_metadata.mentions);
                    }
                }
            }
        } else {
            engagedUsers = anno;
        }

        function uniqueCount(userName) {
            return uniqueNames.indexOf(userName) + 1;
        }

        angular.forEach(engagedUsers, function(mentionedUser, index) {
            if ((mentionedUser["display_name"] === "") ||
                (teamUsers &&  teamUsers.length &&
                 teamUsers.some(function(user) { return user["user_email"] === mentionedUser["user_email"]; }) && perAnnoEngagedUsers)) {
                delete engagedUsers[index];
            } else  if (!mentionedUser.hasOwnProperty('unique_name')) {
                var uniqueUserName = mentionedUser["display_name"].replace(/ /g, ""),
                    uniqueUserNameCount = uniqueCount(uniqueUserName);

                if (uniqueUserNameCount > 0) {
                    uniqueUserName += uniqueUserNameCount;
                }

                mentionedUser["unique_name"] = uniqueUserName;
                uniqueNames.push(uniqueUserName);
            }
        });

        return engagedUsers.concat(teamUsers).filter(function(user) { return angular.isDefined(user); });
    }

    function getAnnoById(anno_list, anno_id) {
        var annoData = {};

        if (anno_list.length) {
            var annoDataList = anno_list.filter(function(anno) {
                return anno.id === anno_id;
            });

            if (annoDataList.length) {
                annoData = annoDataList[0];
            }
        }

        return annoData;
    };

    function watchersContainedIn(scope) {
        // from http://www.closedinterval.com/count-angularjs-watchers/
        var slice = [].slice;
        var elems = slice.call(document.querySelectorAll("*"));

        return elems.map(function(elem) {
            var data = angular.element(elem).data();
            return data.$scope || null;
        }).filter(function(scope) {
            return scope && scope.$$watchers;
        }).reduce(function(tmp, scope) {
            if (tmp.cache[scope.$id]) {
                return tmp;
            }
            tmp.cache[scope.$id] = true;
            tmp.count += scope.$$watchers.length;
            return tmp;
        }, {
            count : 0,
            cache : {}
        }).count;
    };

    function getUniqueData(data, key) {
        var newArr = [], found;

        angular.forEach(data, function(obj) {
            found = undefined;
            angular.forEach(newArr, function(newObj) {
                if (obj[key] === newObj[key] && !found) found = true;
            });
            if (!found) newArr.push(obj);
        });

        return newArr;
    };

    return {
        storeUserDataInCookies : storeUserDataInCookies,
        removeUserDataCookies : removeUserDataCookies,
        replaceURLWithLink : replaceURLWithLink,
        replaceEmailWithName : replaceEmailWithName,
        replaceHashTagWithLink : replaceHashTagWithLink,
        replaceUniqueUserNameWithID : replaceUniqueUserNameWithID,
        findAncestor : findAncestor,
        getUniqueEngagedUsers : getUniqueEngagedUsers,
        getAnnoById : getAnnoById,
        watchersContainedIn : watchersContainedIn,
        getUniqueData : getUniqueData
    };
});

ServiceModule.factory('Autocomplete', function(Utils) {
    var Autocomplete = {}, currentTextareaInput, currentWord;

    Autocomplete.currentEngagedUserList = [];
    Autocomplete.currentHashtagList = [];

    Autocomplete.setSuggestionBoxPosition = function(event, suggestion_div) {
        var currentTargetBoundingRect = event.target.getBoundingClientRect(),
            leftValue = (currentTargetBoundingRect.width / 2 + currentTargetBoundingRect.left) - (suggestion_div.clientWidth / 2);

        var topValue = currentTargetBoundingRect.bottom - (currentTargetBoundingRect.height + suggestion_div.clientHeight + 10);
        if ((angular.element(annos)[0].getBoundingClientRect().bottom - currentTargetBoundingRect.bottom) > (suggestion_div.clientHeight + 10)) {
            topValue = currentTargetBoundingRect.bottom + 10;
        }

        suggestion_div.style.left = leftValue + 'px';
        suggestion_div.style.top = topValue + 'px';
    };

    Autocomplete.typeahead = function(event, anno_list, hashtag_list, callback) {
        currentTextareaInput = event.target;
        var selectionStart = currentTextareaInput.selectionStart,
            suggestion_div,
            wordList = currentTextareaInput.value.slice(0, selectionStart).split(" ").reverse();

        if (wordList.length) {
            var lastWord = wordList[0];
            if (lastWord.search(/^@/) !== -1) {
                currentWord = lastWord.split("@")[1];
                suggestion_div = document.querySelector("#engaged-users-suggestion");

                var anno_item = Utils.findAncestor(currentTextareaInput, 'anno-item'),
                    anno_id = anno_item.dataset.annoId;

                if (currentWord.length) {
                    var anno_item_data = Utils.getAnnoById(anno_list, anno_id);
                    this.currentEngagedUserList = anno_item_data.engaged_users.filter(function(user) {
                        return ((user.display_name.toLowerCase().indexOf(currentWord.toLowerCase()) === 0) ||
                                (user.user_email.toLowerCase().indexOf(currentWord.toLowerCase()) === 0) ||
                                (user.unique_name.indexOf(currentWord) === 0));
                    });
                    if (angular.isFunction(callback)) {
                        callback();
                    }
                    if (this.currentEngagedUserList.length) {
                        suggestion_div.style.display = "block";
                        this.setSuggestionBoxPosition(event, suggestion_div);
                    } else {
                        this.clearSuggestion();
                    }
                } else {
                    this.clearSuggestion();
                }
            } else if (lastWord.search(/^#/) !== -1) {
                currentWord = lastWord.split("#")[1];
                suggestion_div = document.querySelector("#engaged-hashtags-suggestion");

                if (currentWord.length) {
                    this.currentHashtagList = hashtag_list.filter(function(hashtag) {
                        return (hashtag.text.toLowerCase().indexOf(currentWord.toLowerCase()) === 0);
                    });
                    if (angular.isFunction(callback)) {
                        callback();
                    }
                    if (this.currentHashtagList.length) {
                        suggestion_div.style.display = "block";
                        this.setSuggestionBoxPosition(event, suggestion_div);
                    } else {
                        this.clearSuggestion();
                    }
                } else {
                    this.clearSuggestion();
                }
            } else {
                this.clearSuggestion();
            }
        }
    };

    Autocomplete.clearSuggestion = function() {
        currentTextareaInput = undefined;
        currentWord = "";
        document.querySelector("#engaged-users-suggestion").style.display = "none";
        document.querySelector("#engaged-hashtags-suggestion").style.display = "none";
    };

    Autocomplete.selectSuggestion = function(event) {
        if (angular.isUndefined(currentTextareaInput)) return;
        var unique_name = event.currentTarget.dataset.value,
            prefixValue = "@",
            replaceIndex = currentTextareaInput.selectionStart - currentWord.length;

        if (angular.element(event.currentTarget).hasClass("engaged-hashtag")) {
            prefixValue = "#";
        }

        currentTextareaInput.value = currentTextareaInput.value.replaceAt(replaceIndex - 1, currentWord.length + 1, prefixValue + unique_name + " ");
        currentTextareaInput.focus();
        currentTextareaInput.selectionStart = currentTextareaInput.value.length;
        Autocomplete.clearSuggestion();
    };

    return Autocomplete;
});

ServiceModule.factory('DataService', function($http, $location, $window, $cookieStore, Utils, DashboardConstants) {
    var apiRoot = DashboardConstants.apiRoot;

    function checkAuthentication(team_hash, team_name) {
        var primary_url = '/dashboard/' + team_hash + '/' + team_name;
        var action_page = $cookieStore.get('authenticated') ? '/feed' : '/login';
        return primary_url + action_page;
    }

    function makeHTTPCall(endpointName, params, success_callback, error_callback) {
        var endpointData = DashboardConstants.endpointUrl[endpointName];
        var url = apiRoot + "/" + endpointData.root + "/" + DashboardConstants.endpointVersion + "/" + endpointData.path;

        var req = {
            method : endpointData.method,
            url : url,
            cache : true
        };

        if (req.method == "POST") {
            req.data = params;
        } else {
            req.params = params;
        }

        $http(req).success(function(data, status, header, config) {
            if (angular.isFunction(success_callback)) {
                success_callback(data);
            }
        }).error(function(data, status, header, config) {
            console.error("Error:", endpointName);
            if (angular.isFunction(error_callback)) {
                error_callback(status);
            }
        });
    }

    return ({
        checkAuthentication : checkAuthentication,
        makeHTTPCall : makeHTTPCall
    });
});

ServiceModule.factory("ComStyleGetter", function() {
    var userAgentUtil = {
        initialized:false,
        init: function() {
            var n = navigator,
                dua = n.userAgent,
                dav = n.appVersion,tv = parseFloat(dav);

            this.webkit = parseFloat(dua.split("WebKit/")[1]) || undefined;
            this.khtml = dav.indexOf("Konqueror") >= 0 ? tv : undefined;
            this.mac = dav.indexOf("Macintosh") >= 0;
            this.ios = /iPhone|iPod|iPad/.test(dua);
            this.android = parseFloat(dua.split("Android ")[1]) || undefined;
            this.bb = (dua.indexOf("BlackBerry") >= 0 || dua.indexOf("BB10") >=0) ? parseFloat(dua.split("Version/")[1]) || undefined : undefined;

            this.chrome = parseFloat(dua.split("Chrome/")[1]) || undefined;
            this.safari = dav.indexOf("Safari")>=0 && !this.chrome ? parseFloat(dav.split("Version/")[1]) : undefined;

            if (this.chrome) this.chrome = Math.floor(this.chrome);
            if (this.safari) this.safari = Math.floor(this.safari);
            if (this.bb) this.bb = Math.floor(this.bb);

            if (!this.webkit) {
                if (dua.indexOf("Opera") >= 0) {
                    this.opera = tv >= 9.8 ? parseFloat(dua.split("Version/")[1]) || tv : tv;
                    this.opera = Math.floor(this.opera);
                }

                if (dua.indexOf("Gecko") >= 0 && !this.khtml && !this.webkit) {
                    this.mozilla = tv;
                }

                if (this.mozilla) {
                    this.ff = parseFloat(dua.split("Firefox/")[1] || dua.split("Minefield/")[1]) || undefined;
                    if (this.ff) this.ff = Math.floor(this.ff);
                }

                if (document.all && !this.opera) {
                    var isIE = parseFloat(dav.split("MSIE ")[1]) || undefined;
                    var mode = document.documentMode;
                    if (mode && mode != 5 && Math.floor(isIE) != mode) {
                        isIE = mode;
                    }

                    this.ie = isIE;
                }
            }

            if (dua.match(/(iPhone|iPod|iPad)/)) {
                var p = RegExp.$1.replace(/P/, 'p');
                var v = dua.match(/OS ([\d_]+)/) ? RegExp.$1 : "1";
                var os = parseFloat(v.replace(/_/, '.').replace(/_/g, ''));
                this[p] = os;
            }

            this.initialized = true;
        }
    };

    userAgentUtil.init();

    var getComputedStyle;
    if(userAgentUtil["webkit"]) {
        getComputedStyle = function(/*DomNode*/ node) {
            var s;
            if (node.nodeType == 1) {
                var dv = node.ownerDocument.defaultView;
                s = dv.getComputedStyle(node, null);
                if (!s && node.style) {
                    node.style.display = "";
                    s = dv.getComputedStyle(node, null);
                }
            }

            return s || {};
        };
    } else if (userAgentUtil["ie"] && (userAgentUtil["ie"] < 9 || userAgentUtil["quirks"])) {
        getComputedStyle = function(node) {
            // IE (as of 7) doesn't expose Element like sane browsers
            // currentStyle can be null on IE8!
            return node.nodeType == 1 /* ELEMENT_NODE*/ && node.currentStyle ? node.currentStyle : {};
        };
    } else {
        getComputedStyle = function(node) {
            return node.nodeType == 1 /* ELEMENT_NODE*/ ?
                node.ownerDocument.defaultView.getComputedStyle(node, null) : {};
        };
    }

    return {
        getComStyle: getComputedStyle
    };
});
