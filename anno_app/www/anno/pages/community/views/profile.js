define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
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
    function (dom, domClass, domConstruct, domStyle, connect, query, win, registry, DBUtil, annoUtil, OAuthUtil, AnnoDataHandler)
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
            var APIConfig = {
                name: annoUtil.API.user,
                method: "user.user.password.update",
                parameter: {
                    'password':dom.byId('txt_changePwd').value
                },
                needAuth: true,
                success: function(data)
                {
                    // save user info into local db
                    var userInfo = currentUserInfo;
                    userInfo.password = dom.byId('txt_changePwd').value;

                    AnnoDataHandler.saveUserInfo(userInfo, function(){
                        OAuthUtil.processBasicAuthToken(currentUserInfo);
                        closeChangePasswordDialog();
                        annoUtil.showToastMessage("Password has been changed.");
                    });
                },
                error: function(){
                }
            };

            annoUtil.callGAEAPI(APIConfig);
        };

        var exitApp = function()
        {
            var dlg = registry.byId('dlg_common_confirm_message');
            var changePwdDialog = registry.byId('changePwdDialog');

            if (dlg&&(dlg.domNode.style.display == ''||dlg.domNode.style.display == 'block'))
            {
                dlg.hide();
            }
            else if (changePwdDialog&&(changePwdDialog.domNode.style.display == ''||changePwdDialog.domNode.style.display == 'block'))
            {
                closeChangePasswordDialog();
            }
            else
            {
                history.back();
            }
        };

        var openChangePasswordDialog = function()
        {
            var changePwdDialog = registry.byId('changePwdDialog');
            changePwdDialog.show();
            domStyle.set(changePwdDialog._cover[0], {"height": "100%", top:"0px"});
        };

        var closeChangePasswordDialog = function()
        {
            var changePwdDialog = registry.byId('changePwdDialog');
            changePwdDialog.hide();
        };

        var signOut = function()
        {
            var phoneGapPath = OAuthUtil.getPhoneGapPath();
            AnnoDataHandler.removeUser(function ()
            {
                OAuthUtil.clearRefreshToken();
                annoUtil.clearDeviceId(function(){
                    window.open(phoneGapPath + "anno/pages/community/main.html", '_self', 'location=no');
                });
            });
        };

        var drawCommunityList = function(data)
        {
            var itemList = registry.byId('communityList');
            itemList.destroyDescendants();

            if (data.length)
            {
                domStyle.set("communityListTitle", "display", "");
                domStyle.set("communityList", "display", "");
            }

            for (var i= 0,c=data.length;i<c;i++)
            {
                domConstruct.create("li", {
                    "transition":'slide',
                    "class": "row",
                    "data-dojo-type":"dojox/mobile/ListItem",
                    "data-dojo-props":"variableHeight:true,clickable:true,noArrow:true,_duration:50,_index:"+i,
                    innerHTML: '<span>'+data[i].community.name+'</span><span id="isCommunityManager" class="icon-bolt annoOrangeColor" style="margin-left: 4px;vertical-align: middle;"></span>'
                }, itemList.domNode, "last");
            }

            annoUtil.getParser().parse(itemList.domNode);

            var items = itemList.getChildren();

            for (var i= 0,c=items.length;i<c;i++)
            {
                if (data[i].role == "manager" || data[i].role == "admin")
                {
                    items[i].on("click", function(){
                        gotoCommunityViewer(this);
                    });
                } else {
                    items[i].domNode.childNodes[1].style.display = "none";
                }
            }
        };

        var gotoCommunityViewer = function(listItem)
        {
            app.transitionToView(listItem.domNode, {target:'community',url:'#community', params:{index:listItem._index}});
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

                _connectResults.push(connect.connect(registry.byId("profileItemSignOut"), 'onClick', function(e)
                {
                    annoUtil.showConfirmMessageDialog("Are you sure?", function(ret){
                        if (ret)
                        {
                            signOut();
                        }
                    });
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

                // get and show community list
                annoUtil.loadUserCommunities(false, function(data){
                    drawCommunityList(data.communityList);
                });
            },
            afterActivate: function()
            {
                document.addEventListener("backbutton", exitApp, false);

                // Analytics
                annoUtil.screenGATracking(annoUtil.analytics.category.profile);
            },
            beforeDeactivate: function()
            {
                document.removeEventListener("backbutton", exitApp, false);
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
