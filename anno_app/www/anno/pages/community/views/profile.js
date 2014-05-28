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

        var adjustSize = function()
        {
            var viewPoint = win.getBox();

            domStyle.set("listContainerProfile", "height", (viewPoint.h-48)+"px");
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

                            closeChangePasswordDialog();

                            annoUtil.showToastMessage("Password has been changed.");
                        });
                        annoUtil.hideLoadingIndicator();
                    });
                });
            });
        };

        var exitApp = function()
        {
            closeChangePasswordDialog();
        };

        var openChangePasswordDialog = function()
        {
            var changePwdDialog = registry.byId('changePwdDialog');
            changePwdDialog.show();
            domStyle.set(changePwdDialog._cover[0], {"height": "100%", top:"0px"});

            document.addEventListener("backbutton", exitApp, false);
        };

        var closeChangePasswordDialog = function()
        {
            var changePwdDialog = registry.byId('changePwdDialog');
            changePwdDialog.hide();

            document.removeEventListener("backbutton", exitApp, false);
        };

        return {
            // simple view init
            init:function ()
            {
                app = this.app;
                adjustSize();

                _connectResults.push(connect.connect(registry.byId("profileItemChangePassword"), 'onClick', function(e)
                {
                    openChangePasswordDialog();
                }));

                _connectResults.push(connect.connect(dom.byId("btnCancelChangePwd"), 'click', function(e)
                {
                    closeChangePasswordDialog();
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
                    domStyle.set('profileItemChangePassword', 'display', 'none');
                }

                dom.byId('profileEmail').innerHTML = currentUserInfo.email;
                dom.byId('profileDisplayName').innerHTML = currentUserInfo.nickname;
            },
            afterActivate: function()
            {
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