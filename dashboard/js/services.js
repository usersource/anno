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

    function replaceUniqueUserNameWithID(s, tagged_users, engaged_users) {
        tagged_users = tagged_users || [];
        engaged_users = engaged_users || [];
        engaged_users = engaged_users.concat(tagged_users);

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
                taggedUserIDs.push(userID);
            }
        });

        return [s, taggedUserIDs];
    }

    function replaceEmailWithName(s, tagged_users, engaged_users) {
        tagged_users = tagged_users || [];
        engaged_users = engaged_users || [];
        tagged_users = tagged_users.concat(engaged_users);

        var matchedEmailList = s.match(/(^|\W)(__[a-z\d][\w]*)/ig) || [];
        angular.forEach(matchedEmailList, function(id) {
            id = id.trim();
            var filteredUser = tagged_users.filter(function(user) {
                return user.id === id.split("__")[1];
            });
            if (filteredUser.length) {
                var userDisplayName = filteredUser[0]["display_name"];
                s = s.replace(id, "<span class='tagged-user'>" + userDisplayName + "</span>");
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

    function getUniqueEngagedUsers(engagedUsers, teamUsers, perAnnoEngagedUsers) {
        var uniqueNames = [], uniqueUserName;
        engagedUsers = engagedUsers || [];

        function uniqueCount(userName) {
            return uniqueNames.indexOf(userName) + 1;
        }

        angular.forEach(engagedUsers, function(mentionedUser, index) {
            if ((mentionedUser["display_name"] === "") ||
                (teamUsers.some(function(user) { return user["user_email"] === mentionedUser["user_email"]; }) && perAnnoEngagedUsers)) {
                delete engagedUsers[index];
            } else  if (!("unique_name" in mentionedUser)) {
                var uniqueUserName = mentionedUser["display_name"].replace(/ /g, ""),
                    uniqueUserNameCount = uniqueCount(uniqueUserName);

                if (uniqueUserNameCount > 0) {
                    uniqueUserName += uniqueUserNameCount;
                }

                mentionedUser["unique_name"] = uniqueUserName;
                uniqueNames.push(uniqueUserName);
            }
        });

        return engagedUsers.concat(teamUsers).filter(function(user) { return user != undefined; });
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

    return {
        storeUserDataInCookies : storeUserDataInCookies,
        removeUserDataCookies : removeUserDataCookies,
        replaceURLWithLink : replaceURLWithLink,
        replaceEmailWithName : replaceEmailWithName,
        replaceHashTagWithLink : replaceHashTagWithLink,
        replaceUniqueUserNameWithID : replaceUniqueUserNameWithID,
        findAncestor : findAncestor,
        getUniqueEngagedUsers : getUniqueEngagedUsers,
        getAnnoById : getAnnoById
    };
});

ServiceModule.factory('Autocomplete', function(Utils) {
    var Autocomplete = {}, currentTextareaInput, currentWord;
    Autocomplete.currentEngagedUserList = [];

    Autocomplete.setSuggestionBoxPosition = function(event, suggestion_div) {
        var currentTargetBoundingRect = event.srcElement.getBoundingClientRect(),
            leftValue = (currentTargetBoundingRect.width / 2 + currentTargetBoundingRect.left) - (suggestion_div.clientWidth / 2);

        var topValue = currentTargetBoundingRect.bottom - (currentTargetBoundingRect.height + suggestion_div.clientHeight + 10);
        if ((angular.element(annos)[0].getBoundingClientRect().bottom - currentTargetBoundingRect.bottom) > (suggestion_div.clientHeight + 10)) {
            topValue = currentTargetBoundingRect.bottom + 10;
        }

        suggestion_div.style.left = leftValue + 'px';
        suggestion_div.style.top = topValue + 'px';
    };

    Autocomplete.typeahead = function(event, anno_list, callback) {
        currentTextareaInput = event.srcElement;
        var selectionStart = currentTextareaInput.selectionStart,
            wordList = currentTextareaInput.value.slice(0, selectionStart).split(" ").reverse();

        if (wordList.length && (wordList[0].search(/^@/) !== -1)) {
            currentWord = wordList[0].split("@")[1];
            var anno_item = Utils.findAncestor(currentTextareaInput, 'anno-item'),
                anno_id = anno_item.dataset.annoId,
                suggestion_div = document.querySelector("#engaged-users-suggestion");

            if (currentWord.length) {
                this.currentEngagedUserList = Utils.getAnnoById(anno_list, anno_id).engaged_users.filter(function(user) {
                    return ((user.display_name.toLowerCase().indexOf(currentWord.toLowerCase()) === 0) ||
                            (user.user_email.indexOf(currentWord.toLowerCase()) === 0) ||
                            (user.unique_name.indexOf(currentWord) === 0));
                });
                if (callback !== undefined) {
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
        }
    };

    Autocomplete.clearSuggestion = function() {
        currentTextareaInput = undefined;
        currentWord = "";
        document.querySelector("#engaged-users-suggestion").style.display = "none";
    };

    Autocomplete.selectSuggestion = function(event) {
        if (currentTextareaInput === undefined) return;
        var unique_name = event.currentTarget.dataset.value,
            replaceIndex = currentTextareaInput.selectionStart - currentWord.length;

        currentTextareaInput.value = currentTextareaInput.value.replaceAt(replaceIndex - 1, currentWord.length + 1, "@" + unique_name + " ");
        currentTextareaInput.focus();
        currentTextareaInput.selectionStart = currentTextareaInput.value.length;
        Autocomplete.clearSuggestion();
    };

    return Autocomplete;
});

ServiceModule.factory('DataService', function($http, $location, $window, Utils, DashboardConstants) {
    var apiRoot = DashboardConstants.apiRoot[DashboardConstants.serverURLKey];

    function checkAuthentication() {
        var currentPath = $location.path();
        if ($cookieStore.get('authenticated')) {
            if (currentPath == 'login.html') {
                $window.location.href = $location.absUrl().replace('login.html' , 'feed.html');
            }
        } else {
            if (currentPath == 'feed.html') {
                $window.location.href = $location.absUrl().replace('feed.html' , 'login.html');
                this.removeUserDataCookies();
            }
        }
    }

    function makeHTTPCall(endpointName, params, success_callback, error_callback) {
        var self = this;
        var endpointData = DashboardConstants.endpointUrl[endpointName];
        var url = apiRoot + "/" + endpointData.root + "/" + DashboardConstants.endpointVersion + "/" + endpointData.path;

        var req = {
            method : endpointData.method,
            url : url,
            data : params,
            params : params,
            cache : true
        };

        $http(req).success(function(data, status, header, config) {
            if (success_callback !== undefined) {
                success_callback(data);
            }
        }).error(function(data, status, header, config) {
            console.error("Error:", endpointName);
            if (error_callback !== undefined) {
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
