define([
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/dom-style",
    "dojo/json",
    "dojo/request/xhr",
    "dojo/window",
    "dojox/mobile/SimpleDialog",
    "dojox/mobile/_ContentPaneMixin",
    "dijit/registry",
    "dojo/text!../../ChinaIpTable.json",
    "dojo/text!../../server-url.json",
    "anno/common/DBUtil",
    "anno/common/GestureHandler"
], function(declare, connect, domStyle, dojoJson, xhr, win, SimpleDialog, _ContentPaneMixin, registry, ChinaIpTable, serverURLConfig, DBUtil, GestureHandler){

    ChinaIpTable = dojoJson.parse(ChinaIpTable);
    serverURLConfig = dojoJson.parse(serverURLConfig);
    console.error("using server Url config:" + JSON.stringify(serverURLConfig));
    var util = {
        loadingIndicator:null,
        _parser:null,
        annoType: {
            SimpleComment:"simple comment",
            DrawComment:"draw comment"
        },
        level1Color:"#ff9900",
        level1ColorRGB:"255, 153, 0",
        level2Color:"#ff0000",
        level2ColorRGB:"255, 0, 0",
        ChinaIpTable:ChinaIpTable.ChinaIpTable,
        myIPIsServiceUrl:"http://178.18.16.111/myipis",
        annoScreenshotPath:null,
        annoPermaLinkBaseUrl:"http://anno-webapp.appspot.com/usersource/pages/permalink/index.html#/anno/",
        API:{
            config:serverURLConfig,
            apiVersion:"1.0",
            anno:"anno",
            user:"user",
            account:"account",
            followUp:"followup",
            vote:"vote",
            flag:"flag"
        },
        timeString:{
            prefixAgo: "",
            suffixAgo: "ago",
            seconds: "%d seconds",
            minute: "a minute",
            minutes: "%d minutes",
            hour: "an hour",
            hours: "%d hours",
            day: "a day",
            days: "%d days",
            month: "a month",
            months: "%d months",
            year: "a year",
            years: "%d years",
            wordSeparator: " ",
            numbers: []
        },
        localStorageKeys:{
            editAnnoDone: "editAnnoDone",
            updatedAnnoData: "updatedAnnoData",
            currentAnnoData: "currentAnnoData",
            currentImageData: "currentImageData"
        },
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
                    console.error(JSON.stringify(e));
                    // alert(JSON.stringify(e));
                    annoUtil.showAlertDialog(JSON.stringify(e));
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
                    // alert(err);
                    annoUtil.showAlertDialog(err);
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
                    // alert(err);
                    annoUtil.showAlertDialog(err);
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
                console.error("app_settings rows: "+rows.length);

                var settings = {}, item;
                for (var i= 0,c=rows.length;i<c;i++)
                {
                    item = rows.item(i);
                    settings[item.item] = item.value;
                }

                console.error("app_settings : "+JSON.stringify(settings));

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
            domStyle.set(dlg._cover[0], {"height": "100%", top:"0px"});
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
                        // alert(err);
                        annoUtil.showAlertDialog(err);
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
                gapi.client.load(apiId, this.API.apiVersion, function(res) {

                    if (res&&res.error)
                    {
                        console.error(apiId+" API load failed.");

                        if (errorCallback)
                        {
                            errorCallback();
                        }
                        else
                        {
                            // alert('Load '+apiId+" API failed, "+res.error.message);
                            annoUtil.showAlertDialog('Load '+apiId+" API failed, "+res.error.message);
                            self.hideLoadingIndicator();
                        }
                    }
                    else
                    {
                        console.error(apiId+" API loaded.");
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
        inChina: function(callback)
        {
            console.error("invoke inChina");

            var self = this;
            this.getIPAddress(function(ip){
                callback(self.isIpInChina(ip));
            });
        },
        getIPAddress: function(callback)
        {
            this._getIpAddressFromServer(callback);
        },
        _getIpAddressFromServer: function(callback)
        {
            this.showLoadingIndicator();
            var self = this;
            xhr.get(this.myIPIsServiceUrl,
                {
                    handleAs: "text",
                    headers:{"X-Requested-With":""}
                }).then(function (res)
                {
                    console.error("got ip from myipis service: "+res);
                    callback(res);
                    self.hideLoadingIndicator();
                },
                function (res)
                {
                    self.hideLoadingIndicator();
                    // alert("getting IP Address from myipis service failed: "+res);
                    annoUtil.showAlertDialog("getting IP Address from myipis service failed: "+res);
                    navigator.app.exitApp();
                });
        },
        isIpInChina: function(ip)
        {
            var iPTable = this.ChinaIpTable, ipItem, ipInt = this.ip2Int(ip);
            console.error("user ip is: "+ip+", ipInt is: "+ ipInt);

            for (var i= 0,c=iPTable.length;i<c;i++)
            {
                ipItem = iPTable[i];

                if (ipInt >= ipItem.iSt && ipInt <= ipItem.iEd)
                {
                    console.error("user ip is in China.");
                    return true;
                }
            }

            console.error("user ip is not in China.");
            return false;
        },
        ip2Int: function (s)
        {
            var parts = s.split(".");
            var sum = parseInt(parts[0], 10)*16777216 + parseInt(parts[1], 10)*65536 +parseInt(parts[2], 10)*256 +parseInt(parts[3], 10);

            return sum;
        },
        int2Ip: function (s)
        {
            var ip = '', r;
            s = parseInt(s).toString(16);
            for (var i = 0; i < s.length; i++)
            {
                r = '';
                r += s[i];
                i++;
                r += s[i];
                ip += parseInt('0x' + r).toString(10) + '.';
            }
            return ip.substr(0, ip.length - 1);
        },
        chooseProxyServer:function()
        {
            var normalServerConfig = this.API.config["1"];
            var proxyServerConfig = normalServerConfig.proxyKey;

            this.saveSettings({item:"ServerURL", value:proxyServerConfig}, function(success){
            }, true);
            this.settings.ServerURL = proxyServerConfig;
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
                        // alert(err);
                        annoUtil.showAlertDialog(err);
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
                        // alert(err);
                        annoUtil.showAlertDialog(err);
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
                        // alert(err);
                        annoUtil.showAlertDialog(err);
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
        getTimeAgoString: function(s)
        {
            // translate timestamp string to "N minutes/hours/days/months ago" format
            var date1 = new Date(s);

            function distance(date)
            {
                return (new Date().getTime() - date.getTime());
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
        showAlertDialog: function(msg, title) {
            var msgTitle = "";

            if (title !== undefined) {
                msgTitle = title;
            }

            cordova.exec(
                function (data) {},
                function (err) {},
                "AnnoCordovaPlugin", 'show_alert_dialog',
                [msg, msgTitle]
            );
        }
    };

    return util;
});