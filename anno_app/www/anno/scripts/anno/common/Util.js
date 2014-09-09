define([
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/json",
    "dojo/request/xhr",
    "dojo/window",
    "dojox/mobile/SimpleDialog",
    "dojox/mobile/_ContentPaneMixin",
    "dijit/registry",
    "dojo/text!../../server-url.json",
    "dojo/text!../../strings.json",
    "anno/common/DBUtil",
    "anno/common/GestureHandler"
], function(declare, connect, dom, domStyle, dojoJson, xhr, win, SimpleDialog, _ContentPaneMixin, registry, serverURLConfig, stringsRes, DBUtil, GestureHandler){

    String.prototype.replaceAt = function(startIndex, replaceCount, character) {
        return this.substr(0, startIndex) + character + this.substr(startIndex + replaceCount);
    };

    serverURLConfig = dojoJson.parse(serverURLConfig);
    stringsRes = dojoJson.parse(stringsRes);
    // console.log("using server Url config:" + JSON.stringify(serverURLConfig));
    var popularTags = [];
    var suggestTags = false, countToSuggestTags = 0, tagStringArray = [];
    var MIN_CHAR_TO_SUGGEST_TAGS = 2;
    var util = {
        loadingIndicator:null,
        _parser:null,
        annoType: {
            SimpleComment:"simple comment",
            DrawComment:"draw comment"
        },
        annotationWidth: 4,
        level1Color:"#ff9900",
        level1ColorRGB:"255, 153, 0",
        level2Color:"#ff0000",
        level2ColorRGB:"255, 0, 0",
        myIPIsServiceUrl:"http://178.18.16.111/myipis",
        annoScreenshotPath:null,
        API_RETRY_TIMES: 0,
        annoPermaLinkBaseUrl:"http://anno-webapp.appspot.com/usersource/pages/permalink/index.html#/anno/",
        ERROR_TYPES:{
            "LOAD_GAE_API": 1,
            "API_RESPONSE_EMPTY": 2,
            "API_RETRY_FAILED": 3,
            "API_CALL_FAILED": 4,
            "CORDOVA_API_FAILED": 5,
            "OS_API_FAILED": 6,
            "DB_API_FAILED": 7,
            "REFRESH_OAUTH_TOKEN": 8,
            "GET_OAUTH_TOKEN": 9
        },
        ERROR_CODE:{
            "BAD_REQUEST": 400,
            "UNAUTHORIZED": 401,
            "FORBIDDEN": 403,
            "NOT_FOUND": 404,
            "INTERNAL_SERVER_ERROR": 503
        },
        API:{
            config:serverURLConfig,
            apiVersion:"1.0",
            anno:"anno",
            user:"user",
            account:"account",
            followUp:"followup",
            vote:"vote",
            flag:"flag",
            community: "community",
            tag: "tag"
        },
        timeString:{
            prefixAgo: "",
            suffixAgo: "",
            seconds: "%ds",
            minute: "1m",
            minutes: "%dm",
            hour: "1h",
            hours: "%dh",
            day: "1d",
            days: "%dd",
            month: "1mo",
            months: "%dmo",
            year: "1y",
            years: "%dy",
            wordSeparator: "",
            numbers: []
        },
        localStorageKeys:{
            editAnnoDone: "editAnnoDone",
            updatedAnnoData: "updatedAnnoData",
            currentAnnoData: "currentAnnoData",
            currentImageData: "currentImageData",
            deviceId: "annoDeviceId"
        },
        userCommunities: null, // all communities for current user
        deviceList: {
            "iPhone1,1" : "iPhone",
            "iPhone1,2" : "iPhone3G",
            "iPhone2,1" : "iPhone3GS",
            "iPhone3,1" : "iPhone4",
            "iPhone4,1" : "iPhone4S",
            "iPhone5,1" : "iPhone5GSM",
            "iPhone5,2" : "iPhone5CDMA",
            "iPhone5,3" : "iPhone5C",
            "iPhone6,1" : "iPhone5S"
        },
        versionInfo: { "version" : "", "build" : "" },
        hasConnection: function()
        {
            var networkState = navigator.connection.type;

            if (networkState == "unknown"||networkState == "none")
            {
                return false;
            }
            else
            {
                return true;
            }
        },
        getTimeStamp: function()
        {
            return new Date().getTime();
        },
        getDeviceInfo: function()
        {
            return {
                model: device.model,
                osName:device.platform,
                osVersion:device.version
            };
        },
        getBase64FileContent: function(filePath, callback)
        {
            function getiOSRelativePath(rootPath, filePath) {
                rootPath = rootPath.replace(/^file:\/\//, "");
                var rootPathArray = rootPath.split("/");
                var filePathArray = filePath.split("/");
                var relativePath = "";
                if (rootPathArray[0] == "localhost") rootPathArray[0] = "";

                for (i=0;i<rootPathArray.length;i++) {
                    if (decodeURI(rootPathArray[i]) != decodeURI(filePathArray[i])) {
                        break;
                    }
                }

                for(j=0;j<(rootPathArray.length-i);j++){
                    relativePath += "../";
                }

                relativePath += filePathArray.splice(i, filePathArray.length-i).join("/");
                console.log(relativePath);
                return relativePath;
            }

            if (this.isIOS()) {
                var rootPath;
                localFileSystem.root.getParent(function(f) {
                    rootPath = f.nativeURL;
                    filePath = getiOSRelativePath(rootPath, filePath);
                    beforeCallback();
                });
            } else {
                beforeCallback();
            }

            function beforeCallback() {
                console.error(filePath);
                localFileSystem.root.getFile(filePath, {create:false,exclusive: false}, function(f){
                    f.file(function(e){
                        var reader = new FileReader();
                        reader.onloadend = function (evt) {
                            console.error("file read end:");
                            var pos = evt.target.result.lastIndexOf(",");
                            callback(evt.target.result.substr(pos+1));
                        };
                        reader.readAsDataURL(e);
                    });
                }, function(e) {
                    self.showErrorMessage({type: self.ERROR_TYPES.CORDOVA_API_FAILED, message: JSON.stringify(e)});
                });}
        },
        showLoadingIndicator: function ()
        {
            var cl = this.loadingIndicator;

            if (!cl)
            {
                cl = this.loadingIndicator = new CanvasLoader('', {
                    id: "detail_loading"
                });
                cl.setColor('#302730');
                cl.setDiameter(50);
                cl.setRange(0.9);
            }

            var viewPoint = win.getBox();
            domStyle.set("detail_loading", {
                position: 'absolute',
                left: ((viewPoint.w - 50) / 2) + 'px',
                top: ((viewPoint.h - 50) / 2) + 'px',
                zIndex: 4000
            });

            cl.show();
        },
        hideLoadingIndicator: function ()
        {
            if (this.loadingIndicator)
            {
                this.loadingIndicator.hide();
            }
        },
        getParser: function ()
        {
            if (!this._parser)
            {
                try
                {
                    // returns dojo/parser if loaded, otherwise throws
                    this._parser = require("dojo/parser");
                }
                catch (e)
                {
                    // if here, dojo/parser not loaded
                    try
                    {
                        // returns dojox/mobile/parser if loaded, otherwise throws
                        this._parser = require("dojox/mobile/parser");
                    }
                    catch (e)
                    {
                        // if here, both dojox/mobile/parser and dojo/parser are not loaded
                        console.error("Add explicit require(['dojo/parser']) or explicit require(['dojox/mobile/parser']), one of the parsers is required!");
                    }
                }
            }

            return this._parser;
        },
        startActivity: function(activityName, closeCurrentActivity)
        {
            cordova.exec(
                function (result)
                {
                },
                function (err)
                {
                    self.showErrorMessage({type: self.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
                },
                "AnnoCordovaPlugin",
                'start_activity',
                [activityName, closeCurrentActivity]
            );
        },
        getAnnoScreenshotPath: function(callback)
        {
            if (this.annoScreenshotPath)
            {
                if (callback)
                {
                    callback(this.annoScreenshotPath);
                }
                return this.annoScreenshotPath;
            }
            var screenShotPath = "";
            cordova.exec(
                function (result)
                {
                    screenShotPath = result;
                    this.annoScreenshotPath = screenShotPath;

                    if (callback)
                    {
                        callback(screenShotPath);
                    }
                },
                function (err)
                {
                    self.showErrorMessage({type: self.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
                },
                "AnnoCordovaPlugin",
                'get_anno_screenshot_path',
                []
            );

            return screenShotPath;
        },
        readSettings: function(callback)
        {
            if (this.settings)
            {
                callback(this.settings);
                return;
            }
            var settingsSQl = "select * from app_settings";
            var self = this;
            DBUtil.executeSelectSql(settingsSQl, [], function(res){
                if (!res) return;

                var rows = res.rows;
                // console.log("app_settings rows: " + rows.length);

                var settings = {}, item;
                for (var i= 0,c=rows.length;i<c;i++)
                {
                    item = rows.item(i);
                    settings[item.item] = item.value;
                }

                console.log("app_settings : " + JSON.stringify(settings));

                self.settings = settings;
                callback(settings);
            }, onSQLError);
        },
        saveSettings: function(settingItem, callback, newRecord)
        {
            var settingsSQl = "update app_settings set value=? where item=?";

            if (newRecord)
            {
                settingsSQl = "insert into app_settings(value, item) values(?,?)";
            }
            var self = this;
            DBUtil.executeUpdateSql(settingsSQl, [settingItem.value, settingItem.item], function(res){
                if (!res) return;
                self.settings[settingItem.item] = settingItem.value;

                callback(true);
            }, function(err){
                callback(false);
            });
        },
        getSettings: function()
        {
            return this.settings;
        },
        noop: function()
        {

        },
        showMessageDialog: function (message, callback)
        {
            var dlg = registry.byId('dlg_common_message');

            if (!dlg)
            {
                dlg = new (declare([SimpleDialog, _ContentPaneMixin]))({
                    id: "dlg_common_message",
                    content: '' +
                        '<div id="div_cancel_common_message_message" class="mblSimpleDialogText">' + message + '</div>' +
                        '<div style="text-align: center"><button id="btn_cancel_common_message" class="btn">OK</button></div>'
                });
                dlg.startup();

                connect.connect(document.getElementById('btn_cancel_common_message'), 'click', function ()
                {
                    registry.byId('dlg_common_message').hide();

                    if (dlg._callback)
                    {
                        dlg._callback();
                    }
                });
            }
            else
            {
                document.getElementById("div_cancel_common_message_message").innerHTML = message;
            }

            dlg._callback = callback;
            dlg.show();
            // domStyle.set(dlg._cover[0], { "height" : "100%", "top" : "0px" });
            domStyle.set(dlg.containerNode.firstChild, { "margin" : "0", "padding" : "3px 0" });
        },
        showToastDialog: function (message, timeOut) {
            var dlg = registry.byId('dlg_common_toast');

            if (timeOut === undefined) {
                timeOut = 5000;
            }

            if (!dlg) {
                dlg = new (declare([SimpleDialog, _ContentPaneMixin]))({
                    id : "dlg_common_toast",
                    content : '<div id="div_cancel_common_toast_message" class="mblSimpleDialogText">' + message + '</div>'
                });
                dlg.startup();
            } else {
                document.getElementById("div_cancel_common_toast_message").innerHTML = message;
            }

            dlg.show();
            domStyle.set(dlg._cover[0], { "height" : "100%", "top" : "0" });
            domStyle.set(dlg.domNode, { "top" : "initial", "bottom" : "50px" });
            domStyle.set(dlg.containerNode.firstChild, { "margin" : "0" });

            setTimeout(function() {
                registry.byId('dlg_common_toast').hide();
            }, timeOut);
        },
        showConfirmMessageDialog: function (message, callback)
        {
            var dlg = registry.byId('dlg_common_confirm_message');

            if (!dlg)
            {
                dlg = new (declare([SimpleDialog, _ContentPaneMixin]))({
                    id: "dlg_common_confirm_message",
                    content: '' +
                        '<div id="div_cancel_confirm_message_message" class="mblSimpleDialogText">' + message + '</div>' +
                        '<div style="text-align: center"><button id="btn_ok_confirm_message" class="btn">OK</button><button id="btn_cancel_confirm_message" class="btn">Cancel</button></div>'
                });
                dlg.startup();

                connect.connect(document.getElementById('btn_cancel_confirm_message'), 'click', function ()
                {
                    registry.byId('dlg_common_confirm_message').hide();

                    if (dlg._callback)
                    {
                        dlg._callback(false);
                    }
                });

                connect.connect(document.getElementById('btn_ok_confirm_message'), 'click', function ()
                {
                    registry.byId('dlg_common_confirm_message').hide();

                    if (dlg._callback)
                    {
                        dlg._callback(true);
                    }
                });
            }
            else
            {
                document.getElementById("div_cancel_confirm_message_message").innerHTML = message;
            }

            dlg._callback = callback;
            dlg.show();
            domStyle.set(dlg._cover[0], {"height": "100%", top:"0px"});
        },
        showSoftKeyboard: function(activityName)
        {
            if (window.cordova&&cordova.exec)
            {
                var param = [];

                if (activityName)
                {
                    param[0] = activityName;
                }

                cordova.exec(
                    function (result)
                    {
                    },
                    function (err)
                    {
                        self.showErrorMessage({type: self.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
                    },
                    "AnnoCordovaPlugin",
                    'show_softkeyboard',
                    param
                );
            }
        },
        getTokenFromURL: function()
        {
            var token = /\?token=(.+)$/.exec(document.location.href);

            if (token)
            {
                var tokenObject = dojoJson.parse(decodeURIComponent(token[1]));
                console.error("got token object:" + JSON.stringify(tokenObject));

                return tokenObject;
            }

            return null;
        },
        openAuthPage: function()
        {
            var url = "file:///android_asset/www/pages/auth/main.html?callback="+document.location.href+"&hasUserInLocalDB="+_hasUserInLocalDB;
            var ref2 = window.open(url, '_self', 'location=no');
        },
        setAuthToken:function(token)
        {
            if (gapi&&gapi.auth)
            {
                gapi.auth.setToken(token);
            }
            else
            {
                var self = this;
                window.setTimeout(function(){
                    self.setAuthToken(token);
                }, 50)
            }
        },
        needAuth:function(token)
        {
            var ret = false;
            console.error("_localUserInfo:"+JSON.stringify(_localUserInfo));
            if ((!token&&!_hasUserInLocalDB)||(!token&&_hasUserInLocalDB&&_localUserInfo.signinmethod=='google'))
            {
                ret = true;
            }

            return ret;
        },
        parseUrlParams: function (surl)
        {
            if (surl.indexOf("?") < 0) return {};
            surl = surl.substr(1);
            var segments = surl.split("&"), params = {};

            for (var i = 0; i < segments.length; i++)
            {
                params[segments[i].split("=")[0]] = decodeURIComponent(segments[i].split("=")[1]);
            }

            return params;
        },
        encodeBase64:function(str)
        {
            return btoa(str);
        },
        getBasicAuthToken: function(userInfo)
        {
            var token = {'token_type':'Basic'};

            token.expires_in = 3600*24;
            token.access_token = this.encodeBase64(userInfo.email+":"+userInfo.password);

            console.error("basic token:"+ JSON.stringify(token));

            return token;
        },
        showToastMessage: function(message)
        {
            cordova.exec(
                function (result)
                {
                },
                function (err)
                {
                },
                "AnnoCordovaPlugin",
                'show_toast',
                [message]
            );
        },
        loadAPI: function(apiId, callback, errorCallback)
        {
            var self = this;
            if (window.gapi&&window.gapi.client)
            {
                console.log("loading "+apiId+" API.");
                gapi.client.load(apiId, this.API.apiVersion, function(res) {

                    if (res&&res.error)
                    {
                        console.log(apiId+" API load failed.");

                        if (errorCallback)
                        {
                            errorCallback(res.error);
                        }
                        else
                        {
                            self.showErrorMessage({type: self.ERROR_TYPES.LOAD_GAE_API, message: 'Load '+apiId+" API failed, "+res.error.message});
                            self.hideLoadingIndicator();
                        }
                    }
                    else
                    {
                        console.log(apiId+" API loaded.");
                        callback();
                    }
                }, this.getCEAPIRoot());
            }
            else
            {
                window.setTimeout(function(){
                    self.loadAPI(apiId, callback, errorCallback);
                }, 50)
            }
        },
        getCEAPIRoot: function()
        {
            var serverURL = this.settings.ServerURL;

            return this.API.config[serverURL].apiRoot;
        },
        getCEAPIConfig: function()
        {
            var serverURL = this.settings.ServerURL;

            return this.API.config[serverURL];
        },
        getCurrentUserInfo:function()
        {
            return DBUtil.localUserInfo;
        },
        getCurrentPosition:function(callback, errorCallback)
        {
            navigator.geolocation.getCurrentPosition(callback, errorCallback, {maximumAge: 1000*60*60, timeout: 10000, enableHighAccuracy: false});
        },
        setDefaultServer: function()
        {
            this.saveSettings({item:"ServerURL", value:"1"}, function(success){
            }, true);
            this.settings.ServerURL = "1";
        },
        triggerCreateAnno: function()
        {
            if (window.cordova&&cordova.exec)
            {
                cordova.exec(
                    function (data)
                    {

                    },
                    function (err)
                    {
                        self.showErrorMessage({type: self.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
                    },
                    "AnnoCordovaPlugin",
                    'trigger_create_anno',
                    []
                );
            }
        },
        enableJSGesture: function()
        {
            GestureHandler.enableJSGesture();
        },
        disableJSGesture: function()
        {
            GestureHandler.disableJSGesture();
        },
        enableNativeGesture: function()
        {
            if (window.cordova&&cordova.exec)
            {
                cordova.exec(
                    function (data)
                    {

                    },
                    function (err)
                    {
                        self.showErrorMessage({type: self.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
                    },
                    "AnnoCordovaPlugin",
                    'enable_native_gesture_listener',
                    [true]
                );
            }
        },
        disableNativeGesture: function()
        {
            if (window.cordova&&cordova.exec)
            {
                cordova.exec(
                    function (data)
                    {

                    },
                    function (err)
                    {
                        self.showErrorMessage({type: self.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
                    },
                    "AnnoCordovaPlugin",
                    'enable_native_gesture_listener',
                    [false]
                );
            }
        },
        isIOS: function()
        {
            return device.platform == "iOS";
        },
        isAndroid: function()
        {
            return device.platform == "Android";
        },
        isRunningAsPlugin: function()
        {
            return this.getSettings().appKey != null;
        },
        unisodate: function(str)
        {
            var tstr, dstr, yyyy, dd, MM, mm, hh, ss;
            var l = str.match(/([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})\.*([0-9]{0,3})/);

            if (l && l.length === 8) {
                return new Date(l[1], l[2] - 1, l[3], l[4], l[5], l[6], l[7]);
            } else
                return null;
        },
        getTimeAgoString: function(s, baseDate)
        {
            // translate timestamp string to "N minutes/hours/days/months ago" format
            if (this.isIOS() && (parseInt(device.version) == 5)) {
                var date1 = this.unisodate(s);
            } else {
                var date1 = new Date(s);
            }

            function distance(date)
            {
                return ((baseDate||new Date()).getTime() - date.getTime());
            }

            var distanceMillis = distance(date1);
            var ts = this.timeString;
            var prefix = ts.prefixAgo;
            var suffix = ts.suffixAgo;

            var seconds = Math.abs(distanceMillis) / 1000;
            var minutes = seconds / 60;
            var hours = minutes / 60;
            var days = hours / 24;
            var years = days / 365;

            function substitute(string, number)
            {
                return string.replace(/%d/i, number);
            }

            var words = seconds < 45 && substitute(ts.seconds, Math.round(seconds)) ||
                seconds < 90 && substitute(ts.minute, 1) ||
                minutes < 45 && substitute(ts.minutes, Math.round(minutes)) ||
                minutes < 90 && substitute(ts.hour, 1) ||
                hours < 24 && substitute(ts.hours, Math.round(hours)) ||
                hours < 42 && substitute(ts.day, 1) ||
                days < 30 && substitute(ts.days, Math.round(days)) ||
                days < 45 && substitute(ts.month, 1) ||
                days < 365 && substitute(ts.months, Math.round(days / 30)) ||
                years < 1.5 && substitute(ts.year, 1) ||
                substitute(ts.years, Math.round(years));

            var separator = ts.wordSeparator || "";

            return [words, suffix].join(separator);
        },
        getResourceString: function(key)
        {
            return stringsRes[key];
        },
        replaceHashTagWithLink: function(s, linkScript)
        {
            return s.replace(/(^|\W)(#[a-z\d][\w-]*)/ig, linkScript);
        },
        replaceURLWithLink: function(s, linkScript)
        {
            s = s.replace(/(^|\W)\b((www\d{0,3}[.])(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig, "$1http://$2");
            return s.replace(/(^|\W)\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig, linkScript);
        },
        loadUserCommunities: function(includeInvite, callback, keepSpinnerShown)
        {
            if (this.userCommunities)
            {
                callback({communityList: this.userCommunities||[]});
                return;
            }

            var self = this;
            var APIConfig = {
                name: this.API.user,
                method: "user.community.list",
                parameter: {include_invite:includeInvite, email:self.getCurrentUserInfo().email},
                showLoadingSpinner: false,
                keepLoadingSpinnerShown: keepSpinnerShown,
                success: function(data)
                {
                    self.userCommunities = data.result.community_list;
                    callback({communityList: self.userCommunities||[], inviteList:data.result.invite_list||[]});
                },
                error: function(){
                }
            };

            this.callGAEAPI(APIConfig);
        },
        getUserCommunities: function()
        {
            return this.userCommunities;
        },
        clearDeviceId: function(callback)
        {
            var deviceId = window.localStorage.getItem(this.localStorageKeys.deviceId);
            // clear local saved device id
            window.localStorage.removeItem(this.localStorageKeys.deviceId);
            // clear server side device id
            var self = this;

            var APIConfig = {
                name: this.API.user,
                method: "user.user.deviceid.update",
                parameter: {
                    device_id: deviceId,
                    device_type:self.isIOS()?"iOS":"Android",
                    clear_device: true
                },
                success: function(data)
                {
                    console.log("device id cleared.");
                    if (callback) callback(true);
                },
                error: function()
                {
                    if (callback) callback(false);
                }
            };

            this.callGAEAPI(APIConfig);
        },
        showErrorMessage: function(error, toast, callback)
        {
            // show error message, wrap the error messages by error type
            // error: an error object {type, message}
            // toast: shown as toast, default is false
            // callback: callback function will be called when user tapped OK button in message popup

            toast = (toast === undefined) ? true : toast;

            var error_message = error.message,
                default_message = "Oops, something went wrong. Please try later.";

            // we can specify different user-friendly message for different error types
            var message = default_message;
            if ((error.code == this.ERROR_CODE.BAD_REQUEST) && (error.type == this.ERROR_TYPES.API_CALL_FAILED) ||
                (error.code == this.ERROR_CODE.UNAUTHORIZED) && (error.type == this.ERROR_TYPES.API_RETRY_FAILED) ||
                (error.code == this.ERROR_CODE.FORBIDDEN) && (error.type == this.ERROR_TYPES.API_CALL_FAILED) ||
                (error.code == this.ERROR_CODE.NOT_FOUND) && (error.type == this.ERROR_TYPES.API_CALL_FAILED)) {
                message = error_message;
            }

            if (toast) {
                this.showToastDialog(message);
            } else {
                this.showMessageDialog(message, callback);
            }

            // output the original error message to console
            console.log(error.message);
        },
        callGAEAPI: function(config, retryCnt)
        {
            // common method that responsible for calling GAE API
            /**
             * config object
             * {
             *    name: "anno", // API name
             *    method: "anno.anno.search" // API method full name
             *    parameter: {} // parameter, object,
             *    needAuth: true|false // if need authorize, default is false
             *    success: function // callback on success
             *    error: function // callback for error, it can be null,
             *    showLoadingSpinner: true|false, default is true
             *    keepLoadingSpinnerShown: true|false, default is false,
             *    showErrorMessage: true|false, default is true
             * }
             */

            retryCnt = retryCnt||0;

            if (retryCnt)
            {
                console.log("retrying "+config.method+" API "+ retryCnt+ " times.");
            }
            else
            {
                console.log("calling "+config.method+" API.");
            }

            config.showLoadingSpinner = config.showLoadingSpinner == null?true:config.showLoadingSpinner;
            config.showErrorMessage = config.showErrorMessage == null?true:config.showErrorMessage;
            config.needAuth = config.needAuth == null?false:config.needAuth;

            if (config.showLoadingSpinner)
            {
                util.showLoadingIndicator();
            }

            if (config.needAuth)
            {
                var OAuthUtil = require("anno/common/OAuthUtil");
                OAuthUtil.getAccessToken(function ()
                {
                    util._callGAEAPI(config, retryCnt);
                }, function (error)
                {
                    // todo: do we need retry if getting access_token failed?
                    if (config.error)
                    {
                        config.error({type: "API-Loading", message: error});
                    }
                });
            }
            else
            {
                util._callGAEAPI(config, retryCnt);
            }
        },
        _callGAEAPI: function(config, retryCnt)
        {
            util.loadAPI(config.name, function ()
            {
                // API Loaded, make API call.
                var method = eval("gapi.client."+config.method)(config.parameter);
                method.execute(function(response)
                {
                    if (!response)
                    {
                        if (!config.keepLoadingSpinnerShown) util.hideLoadingIndicator();

                        if (config.showErrorMessage)
                        {
                            util.showErrorMessage({type: util.ERROR_TYPES.API_RESPONSE_EMPTY, message:"API response is empty."}, true);
                        }

                        console.error("API response is empty.");

                        if (config.error)
                        {
                            config.error({type: util.ERROR_TYPES.API_RESPONSE_EMPTY, message:"API response is empty."}, response);
                        }

                        return;
                    }
                    else if (response.error)
                    {
                        if (!config.keepLoadingSpinnerShown) util.hideLoadingIndicator();

                        if (response.error.code == 401)
                        {
                            if (retryCnt < util.API_RETRY_TIMES)
                            {
                                // retry API call
                                retryCnt++;
                                util.callGAEAPI(config, retryCnt);
                            }
                            else
                            {
                                if (config.showErrorMessage)
                                {
                                    response.error.type = util.ERROR_TYPES.API_RETRY_FAILED;
                                    util.showErrorMessage(response.error);
                                }

                                console.error("API retry for "+config.method+" failed");

                                if (config.error)
                                {
                                    response.error.type = util.ERROR_TYPES.API_RETRY_FAILED;;
                                    config.error(response.error, response);
                                }
                            }
                        }
                        else
                        {
                            if (config.showErrorMessage)
                            {
                                if (dojo.isFunction(config.showErrorMessage))
                                {
                                    if (config.showErrorMessage(response.error))
                                    {
                                        response.error.type = util.ERROR_TYPES.API_CALL_FAILED;
                                        util.showErrorMessage(response.error);
                                    }
                                }
                                else
                                {
                                    response.error.type = util.ERROR_TYPES.API_CALL_FAILED;
                                    util.showErrorMessage(response.error);
                                }
                            }

                            console.error("An error occurred when calling "+config.method+" api: "+response.error.message);

                            if (config.error)
                            {
                                response.error.type = util.ERROR_TYPES.API_CALL_FAILED;
                                config.error(response.error, response);
                            }
                        }

                        return;
                    }
                    else
                    {
                        if (!config.keepLoadingSpinnerShown) util.hideLoadingIndicator();
                        config.success(response);
                    }
                });

            }, function (error)
            {
                // TODO: Loading API failed, do we need retry?
                util.showErrorMessage({type: util.ERROR_TYPES.LOAD_GAE_API ,message:'Load '+config.name+" API failed, "+error.message});
                console.error("Load " + config.name + " API failed, " + error.message);
                if (!config.keepLoadingSpinnerShown)
                {
                    util.hideLoadingIndicator();
                }

                if (config.error)
                {
                    config.error({type: util.ERROR_TYPES.LOAD_GAE_API ,message:'Load '+config.name+" API failed, "+error.message});
                }
            });
        },
        getTopTags: function(limit) {
            var APIConfig = {
                name : this.API.tag,
                method : "tag.tag.popular",
                parameter : { "limit" : limit },
                showLoadingSpinner : false,
                success : function(data) {
                    popularTags = [];
                    data.result.tags.forEach(function(tagData) {
                        popularTags.push(tagData.text);
                    });
                },
                error : function() {
                }
            };

            this.callGAEAPI(APIConfig);
        },
        resetTagSuggestion: function(tagDiv) {
            suggestTags = false;
            countToSuggestTags = 0;
            tagStringArray = [];
            domStyle.set(tagDiv, "display", "none");
        },
        showSuggestedTags: function(event, tagDiv, inputDiv) {
            var keyCode = event.keyCode;

            // for detecting '#' on different platforms:
            // iOS - event.keyIdentifier should be "U+0023"
            // Andriod - event.keyCode should be 51 and event.shiftKey should be true
            if ((event.keyIdentifier == "U+0023") || (keyCode == 51 && event.shiftKey == true)) {
                suggestTags = true;
                countToSuggestTags = 0;
                tagStringArray = [];
            } else if (suggestTags) {
                if ((keyCode >= 48 && keyCode <= 57) || (keyCode >= 65 && keyCode <= 90)) {
                    countToSuggestTags += 1;
                    tagStringArray.push(String.fromCharCode(keyCode));
                } else if (keyCode == 8) {
                    countToSuggestTags -= 1;
                    tagStringArray.pop();
                } else {
                    this.resetTagSuggestion(tagDiv);
                }

                if (countToSuggestTags >= MIN_CHAR_TO_SUGGEST_TAGS) {
                    this.getTagStrings(tagDiv, inputDiv);
                } else {
                    domStyle.set(tagDiv, "display", "none");
                }
            }
        },
        getTagStrings: function(tagDiv, inputDiv) {
            var annoUtil = this, tagString = tagStringArray.join("");

            var suggestedTagsArray = popularTags.filter(function(string) {
                return string.toLowerCase().indexOf(tagString.toLowerCase()) == 0;
            });

            dom.byId(tagDiv).innerHTML = "";
            suggestedTagsArray.forEach(function(tag) {
                var innerTagDiv = document.createElement("div");
                innerTagDiv.className = "tag";
                innerTagDiv.innerText = tag;
                dom.byId(tagDiv).appendChild(innerTagDiv);

                connect.connect(innerTagDiv, "click", function(e) {
                    dojo.stopEvent(e);
                    var input = dom.byId(inputDiv),
                        replaceIndex = input.selectionStart - tagString.length;
                    input.value = input.value.replaceAt(replaceIndex, tagString.length, tag + " ");
                    annoUtil.resetTagSuggestion(tagDiv);

                    /*setTimeout(function() {
                        input.focus();
                        input.select();
                        input.selectionStart = input.value.length;
                    }, 1000);*/
                });
            });

            if (suggestedTagsArray.length) {
                domStyle.set(tagDiv, "display", "");
            } else {
                domStyle.set(tagDiv, "display", "none");
            }
        },
        parseDeviceModel: function(deviceModel) {
            return (( deviceModel in this.deviceList) ? this.deviceList[deviceModel] : deviceModel);
        },
        getVersionInfo: function() {
            return this.versionInfo;
        },
        setVersionInfo: function() {
            var self = this;
            cordova.exec(
                function(result) {
                    self.versionInfo["version"] = result[0];
                    self.versionInfo["build"] = result[1];
                },
                function(err) {},
                "AnnoCordovaPlugin",
                "get_app_version",
                []
            );
        }
    };

    return util;
});