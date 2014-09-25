define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/_base/connect",
    "dojo/query",
    "dojo/window",
    "dijit/registry",
    "anno/common/DBUtil",
    "anno/common/Util",
    "anno/common/OAuthUtil",
    "anno/anno/AnnoDataHandler"
],
    function (dom, domClass, domStyle, connect, query, win, registry, DBUtil, annoUtil, OAuthUtil, AnnoDataHandler)
    {
        var _connectResults = []; // events connect results
        var app = null;
        var headerTitleSettingsClickCnt = 0;

        var adjustSize = function()
        {
            var viewPoint = win.getBox();

            domStyle.set("listContainerSettings", "height", (viewPoint.h-48)+"px");

            if (viewPoint.w < 450)
            {
                domStyle.set("serverURLDialog", "width", (viewPoint.w-40)+"px");
            }
        };

        var onServerURLRadioButtonChange = function(value)
        {
            if (!this.checked) return;

            var self = this, labelText = this.labelText;
            annoUtil.saveSettings({item:"ServerURL", value:this.value}, function(success){
                if (success)
                {
                    var phoneGapPath = OAuthUtil.getPhoneGapPath();
                    if (DBUtil.localUserInfo.signinmethod == OAuthUtil.signinMethod.google)
                    {
                        AnnoDataHandler.removeUser(function(){
                            OAuthUtil.clearRefreshToken();
                            closeServerURLDialog();
                            // clear device id
                            annoUtil.clearDeviceId(function(){
                                annoUtil.showMessageDialog("Server URL has been changed, please tap OK button to reload the UserSource app.", function(){
                                    window.open(phoneGapPath+"anno/pages/community/main.html", '_self', 'location=no');
                                });
                            });

                        });
                    }
                    else
                    {
                        // use anno account, try to do sign-up to new server, TODO: handle api calling exception
                        var self = this;
                        var email = DBUtil.localUserInfo.email,
                            nickname = DBUtil.localUserInfo.nickname,
                            pwd = DBUtil.localUserInfo.password;

                        var APIConfig = {
                            name: annoUtil.API.account,
                            method: "account.account.register",
                            parameter: {
                                'display_name':nickname,
                                'password':pwd,
                                'user_email':email
                            },
                            showErrorMessage:false,
                            success: function(data)
                            {
                                closeServerURLDialog();
                                // clear device id
                                annoUtil.clearDeviceId(function(){
                                    annoUtil.showMessageDialog("Server URL has been changed, please tap OK button to reload the UserSource app.", function(){
                                        window.open(phoneGapPath+"anno/pages/community/main.html", '_self', 'location=no');
                                    });
                                });
                            },
                            error: function()
                            {
                                closeServerURLDialog();
                                // clear device id
                                annoUtil.clearDeviceId(function(){
                                    annoUtil.showMessageDialog("Server URL has been changed, please tap OK button to reload the UserSource app.", function(){
                                        window.open(phoneGapPath+"anno/pages/community/main.html", '_self', 'location=no');
                                    });
                                });
                            }
                        };

                        annoUtil.callGAEAPI(APIConfig);
                    }
                }
            });
        };

        var initServerUrlRadioButtons = function()
        {
            var serverURLConfig = annoUtil.API.config, configItem, configItemNode;

            for (var p in serverURLConfig)
            {
                configItem = serverURLConfig[p];
                configItemNode = dom.byId("divServerUrl"+configItem["serverId"]);

                if (configItemNode)
                {
                    domStyle.set(configItemNode, "display", "");
                    configItemNode.children[0].innerHTML = configItem.serverName;
                    registry.byId("rdSU"+configItem["serverId"]).set({"labelText": configItem.serverName, value:p});
                }
            }
        };

        var exitApp = function()
        {
            closeServerURLDialog();
        };

        var openServerURLDialog = function()
        {
            var serverURLDialog = registry.byId('serverURLDialog');

            serverURLDialog.show();
            domStyle.set(serverURLDialog._cover[0], {"height": "100%", top:"0px"});

            document.addEventListener("backbutton", exitApp, false);
        };

        var closeServerURLDialog = function()
        {
            var serverURLDialog = registry.byId('serverURLDialog');
            serverURLDialog.hide();

            document.removeEventListener("backbutton", exitApp, false);
        };

        return {
            // simple view init
            init:function ()
            {
                app = this.app;
                adjustSize();
                initServerUrlRadioButtons();

                annoUtil.readSettings(function(settings){
                    var serverURLDialog = registry.byId('serverURLDialog');

                    var radioButtons = serverURLDialog.getChildren();
                    for (var i= 0,c=radioButtons.length;i<c;i++)
                    {
                        if (radioButtons[i].value == settings.ServerURL)
                        {
                            radioButtons[i].set('checked', true, false);
                        }
                    }

                    for (var i= 0,c=radioButtons.length;i<c;i++)
                    {
                        radioButtons[i].onChange = onServerURLRadioButtonChange;
                    }
                });

                var versionInfo = annoUtil.getVersionInfo();
                if (versionInfo["version"] != "" && versionInfo["build"] != "") {
                    dom.byId("versionInfo").innerHTML = "v" + versionInfo["version"] + " build " + versionInfo["build"];
                    domStyle.set("versionInfo", "display", "");
                }

                _connectResults.push(connect.connect(registry.byId("settingItemIntro"), 'onClick', function(e)
                {
                    annoUtil.startActivity("Intro", false);
                }));

                _connectResults.push(connect.connect(registry.byId("settingItemFeedback"), 'onClick', function(e)
                {
                    annoUtil.startActivity("Feedback", false);
                }));

                _connectResults.push(connect.connect(dom.byId("headerTitleSettings"), 'click', function(e)
                {
                    if (headerTitleSettingsClickCnt <2)
                    {
                        headerTitleSettingsClickCnt ++;
                        return;
                    }

                    openServerURLDialog();
                    headerTitleSettingsClickCnt = 0;
                }));

                _connectResults.push(connect.connect(dom.byId("btnCancelServerURL"), 'click', function(e)
                {
                    closeServerURLDialog();
                }));

                _connectResults.push(connect.connect(registry.byId("settingItemProfile"), 'onClick', function(e)
                {
                    app.transitionToView(document.getElementById('settingItemProfile'), {target: 'profile', url: '#profile'});
                }));
            },
            afterActivate: function()
            {
                // Analytics
                annoUtil.screenGATracking(annoUtil.analytics.category.settings);

                if (annoUtil.isIOS()) {
                    domStyle.set(dom.byId("settingItemFeedback"), "display", "none");
                }
            },
            beforeDeactivate: function()
            {

            },
            destroy:function ()
            {
                var connectResult = _connectResults.pop();
                while (connectResult)
                {
                    connect.disconnect(connectResult);
                    connectResult = _connectResults.pop();
                }
            }
        }
    });