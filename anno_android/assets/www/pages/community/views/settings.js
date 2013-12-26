define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/_base/connect",
    "dojo/window",
    "dijit/registry",
    "anno/common/Util",
    "anno/common/OAuthUtil",
    "anno/anno/AnnoDataHandler"
],
    function (dom, domClass, domStyle, connect, win, registry, annoUtil, OAuthUtil, AnnoDataHandler)
    {
        var _connectResults = []; // events connect results
        var app = null;

        var adjustSize = function()
        {
            var viewPoint = win.getBox();

            domStyle.set("listContainerSettings", "height", (viewPoint.h-48)+"px");
        };

        var onServerURLRadioButtonChange = function(value)
        {
            if (!this.checked) return;

            var self = this;
            annoUtil.saveSettings({item:"ServerURL", value:this.value}, function(success){
                if (success)
                {
                    AnnoDataHandler.removeUser(function(){
                        OAuthUtil.clearRefreshToken();
                        registry.byId('serverURLDialog').hide();
                        dom.byId('settingValueServerURL').innerHTML = self.labelText;

                        annoUtil.showMessageDialog("Server URL has been changed, please tap OK button to reload the anno app.", function(){
                            window.open("file:///android_asset/www/pages/community/main.html", '_self', 'location=no');
                        });
                    });
                }
            });
        };

        var submitChangePwd = function()
        {
            annoUtil.showLoadingIndicator();
            OAuthUtil.getAccessToken(function(){
                annoUtil.loadAPI(annoUtil.API.user, function(){
                    var changePasswordAPI = gapi.client.user.user.password.update({
                        'password':dom.byId('txt_changePwd').value
                    });

                    changePasswordAPI.execute(function(resp){
                        if (!resp)
                        {
                            annoUtil.hideLoadingIndicator();
                            annoUtil.showMessageDialog("Response from server are empty when calling user.password.update api.");
                            return;
                        }

                        if (resp.error)
                        {
                            annoUtil.hideLoadingIndicator();

                            annoUtil.showMessageDialog("An error occurred when calling user.password.update api: "+resp.error.message);
                            return;
                        }

                        // save user info into local db
                        var userInfo = currentUserInfo;
                        userInfo.password = dom.byId('txt_changePwd').value;

                        AnnoDataHandler.saveUserInfo(userInfo, function(){
                            var token = annoUtil.getBasicAuthToken(currentUserInfo);
                            annoUtil.setAuthToken(token);

                            var changePwdDialog = registry.byId('changePwdDialog');
                            changePwdDialog.hide();

                            annoUtil.showToastMessage("Password has been changed.");
                        });
                        annoUtil.hideLoadingIndicator();
                    });
                });
            });
        };

        return {
            // simple view init
            init:function ()
            {
                app = this.app;
                adjustSize();

                annoUtil.readSettings(function(settings){
                    var serverURLDialog = registry.byId('serverURLDialog');

                    var radioButtons = serverURLDialog.getChildren();
                    for (var i= 0,c=radioButtons.length;i<c;i++)
                    {
                        if (radioButtons[i].value == settings.ServerURL)
                        {
                            radioButtons[i].set('checked', true, false);
                            dom.byId('settingValueServerURL').innerHTML = radioButtons[i].labelText;
                        }

                    }

                    for (var i= 0,c=radioButtons.length;i<c;i++)
                    {
                        radioButtons[i].onChange = onServerURLRadioButtonChange;
                    }
                });

                _connectResults.push(connect.connect(registry.byId("settingItemServerUrl"), 'onClick', function(e)
                {
                    var serverURLDialog = registry.byId('serverURLDialog');

                    serverURLDialog.show();
                    domStyle.set(serverURLDialog._cover[0], {"height": "100%", top:"0px"});
                }));

                _connectResults.push(connect.connect(registry.byId("settingItemChangePassword"), 'onClick', function(e)
                {
                    var changePwdDialog = registry.byId('changePwdDialog');
                    changePwdDialog.show();
                    domStyle.set(changePwdDialog._cover[0], {"height": "100%", top:"0px"});
                }));

                var radioButtons = registry.byId('serverURLDialog').getChildren();

                /*for (var i= 0,c=radioButtons.length;i<c;i++)
                {
                    radioButtons[i].onChange = onServerURLRadioButtonChange;
                }*/

                _connectResults.push(connect.connect(dom.byId("btnCancelServerURL"), 'click', function(e)
                {
                    var serverURLDialog = registry.byId('serverURLDialog');
                    serverURLDialog.hide();
                }));

                _connectResults.push(connect.connect(dom.byId("btnCancelChangePwd"), 'click', function(e)
                {
                    var changePwdDialog = registry.byId('changePwdDialog');
                    changePwdDialog.hide();
                }));

                _connectResults.push(connect.connect(dom.byId("btnDoneChangePwd"), 'click', function(e)
                {
                    var newPwd = dom.byId('txt_changePwd').value;

                    if (newPwd.length <6)
                    {
                        annoUtil.showMessageDialog("Password must be at least 6 characters long.");
                    }
                    else
                    {
                        submitChangePwd();
                    }
                }));

                if (currentUserInfo.signinMethod == "google")
                {
                    domStyle.set('settingItemChangePassword', 'display', 'none');
                }
            },
            afterActivate: function()
            {
            },
            beforeDeactivate: function()
            {
                registry.byId('serverURLDialog').hide();
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