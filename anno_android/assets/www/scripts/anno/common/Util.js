define([
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/dom-style",
    "dojo/json",
    "dojo/window",
    "dojox/mobile/SimpleDialog",
    "dojox/mobile/_ContentPaneMixin",
    "dijit/registry",
    "anno/common/DBUtil"
], function(declare, connect, domStyle, dojoJson, win, SimpleDialog, _ContentPaneMixin, registry, DBUtil){

    var util = {
        loadingIndicator:null,
        _parser:null,
        annoType: {
            SimpleComment:"simple comment",
            DrawComment:"draw comment"
        },
        level1Color:"#ff9900",
        level2Color:"#ff0000",
        annoScreenshotPath:null,
        API:{
            config:{
                "1": { // Production
                    apiRoot:"https://usersource-anno.appspot.com/_ah/api",
                    clientId : "955803277195.apps.googleusercontent.com",
                    clientSecret: "l5UwDYJuv2BdUUBF2tu9fsol"
                },
                "2": { // Test
                    apiRoot:"https://usersource-anno.appspot.com/_ah/api",
                    clientId : "955803277195.apps.googleusercontent.com",
                    clientSecret: "l5UwDYJuv2BdUUBF2tu9fsol"
                },
                "3": { // Prod via proxy
                    apiRoot:"https://usersource-anno.appspot.com/_ah/api",
                    clientId : "955803277195.apps.googleusercontent.com",
                    clientSecret: "l5UwDYJuv2BdUUBF2tu9fsol"
                },
                "4": { // Test via proxy
                    apiRoot:"https://usersource-anno.appspot.com/_ah/api",
                    clientId : "955803277195.apps.googleusercontent.com",
                    clientSecret: "l5UwDYJuv2BdUUBF2tu9fsol"
                }
            },
            //apiRoot:"https://annoserver-test.appspot.com/_ah/api",
            apiVersion:"1.0",
            anno:"anno",
            user:"user",
            account:"account",
            followUp:"followup",
            vote:"vote",
            flag:"flag"
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
            console.error(filePath);
            localFileSystem.root.getFile(filePath, {create:false,exclusive: false}, function(f){
                f.file(function(e){
                    var reader = new FileReader();
                    reader.onloadend = function (evt)
                    {
                        console.error("file read end:");
                        var pos = evt.target.result.lastIndexOf(",");
                        callback(evt.target.result.substr(pos+1));
                    };
                    reader.readAsDataURL(e);
                });

            }, function(e)
            {
                console.error(JSON.stringify(e));
                alert(JSON.stringify(e));
            });
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
                    alert(err);
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
                    alert(err);
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
        saveSettings: function(settingItem, callback)
        {
            var settingsSQl = "update app_settings set value=? where item=?";
            var self = this;
            DBUtil.executeUpdateSql(settingsSQl, [settingItem.value, settingItem.item], function(res){
                self.settings[settingItem.item] = settingItem.value;

                callback(true);
            }, callback(false));
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
        showSoftKeyboard: function()
        {
            if (window.cordova&&cordova.exec)
            {
                cordova.exec(
                    function (result)
                    {
                    },
                    function (err)
                    {
                        alert(err);
                    },
                    "AnnoCordovaPlugin",
                    'show_softkeyboard',
                    []
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
                        alert('Load '+apiId+" API failed, "+res.error.message);
                        self.hideLoadingIndicator();
                    }
                }
                else
                {
                    console.error(apiId+" API loaded.");
                    callback();
                }
            }, this.getCEAPIRoot());
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
        }
    };


    //document.addEventListener("deviceready", initDB, false);

    return util;
});