define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/string",
    "dojo/dom-style",
    "dojo/_base/array",
    "dojo/_base/connect",
    "dojo/query",
    "dojo/window",
    "dijit/registry",
    "dojox/mobile/ListItem",
    "anno/common/Util",
    "dojo/text!../templates/invitationEmailTemplate.html"
],
    function (dom, domClass, domConstruct, dojoString, domStyle, array, connect, query, win, registry, ListItem, annoUtil, invitationEmailTemplate)
    {
        var _connectResults = []; // events connect results
        var app = null;
        var currentMemberItem, members, currentCommunity;
        var oldWelcomeMsg;

        var adjustSize = function()
        {
            var viewPoint = win.getBox();

            domStyle.set("listContainerCommunity", "height", (viewPoint.h-48)+"px");
        };

        var loadCommunityDetails = function(idx)
        {
            var communities = annoUtil.getUserCommunities(), community = currentCommunity = communities[idx];
            dom.byId("headerTitleCommunity").innerHTML = community.community.name;
            dom.byId("communityWelMsg").innerHTML = community.community.welcome_msg || "";
            dom.byId("communityActivity").innerHTML = community.community.name+" activity";

            annoUtil.showLoadingIndicator();
            annoUtil.loadAPI(annoUtil.API.community, function(){
                var getCommunityList = gapi.client.community.user.list({
                    id : community.community.id,
                    include_invite : true
                });
                getCommunityList.execute(function (data)
                {
                    if (!data)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showToastDialog("Items returned from server are empty.");
                        return;
                    }

                    if (data.error)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showMessageDialog("An error occurred when calling community.user.list api: "+data.error.message);
                        return;
                    }

                    drawUserList(data.result.user_list);
                    annoUtil.hideLoadingIndicator();
                });
            });
        };

        var drawUserList = function(data)
        {
            members = data;
            var itemList = registry.byId('communityUserList'), template, itemData;
            itemList.destroyDescendants();

            for (var i= 0,c=data.length;i<c;i++)
            {
                itemData = data[i];
                if (itemData.status == "pending")
                {
                    template = '<span class="icon-busy annoOrangeColor" style="font-weight: bold"></span>';
                }
                else
                {
                    template = '<span class="icon-checkmark annoOrangeColor" style="font-weight: bold"></span>';
                }

                template = template + '&nbsp;<span>'+itemData.user.display_name+'</span>';

                if (itemData.role == "manager")
                {
                    template = template + '&nbsp;<span class="icon-bolt annoOrangeColor" style="font-weight: bold"></span>';
                }
                else
                {
                    template = template + '&nbsp;<span class="icon-bolt annoOrangeColor" style="font-weight: bold;display: none"></span>';
                }

                template = '<div>'+template+'</div>';

                domConstruct.create("li", {
                    "class": "row listAppName",
                    "data-dojo-type":"dojox/mobile/ListItem",
                    "data-dojo-props":"variableHeight:true,clickable:false,noArrow:true,_duration:0",
                    innerHTML: template
                }, itemList.domNode, "last");
            }

            domConstruct.create("li", {
                "class": "row annoOrangeColor",
                "data-dojo-type":"dojox/mobile/ListItem",
                "data-dojo-props":"variableHeight:true,clickable:false,noArrow:true,_duration:0",
                innerHTML: '<span class="icon-plus" style="font-size: 11pt;"></span>&nbsp;<span>Invite new member</span>'
            }, itemList.domNode, "last");

            annoUtil.getParser().parse(itemList.domNode);

            var items = itemList.getChildren();

            for (var i= 0,c=items.length-1;i<c;i++)
            {
                items[i].userItem = data[i];
                connect.connect(items[i].domNode, 'click', items[i],function(e)
                {
                    dojo.stopEvent(e);
                    showMemberDetail(this);
                });
            }

            connect.connect(items[items.length-1].domNode, 'click', function(e)
            {
                dojo.stopEvent(e);
                inviteNewMember();
            });

        };

        var showMemberDetail = function(listItem)
        {
            currentMemberItem = listItem;
            var data = listItem.userItem;

            listItem.domNode.appendChild(dom.byId("memberDetailContainer"));
            domStyle.set("memberDetailContainer", "display", "");

            dom.byId("memberDetailEmail").innerHTML = data.user.user_email;
            dom.byId("memberDetailFullName").innerHTML = data.user.display_name;
            dom.byId("memberDetailStatus").innerHTML = data.status||"accepted";
            dom.byId("memberDetailRole").innerHTML = data.role;

            if (data.role == "manager")
            {
                dom.byId("btnMakeManager").innerHTML = "Make Member";
            }
            else
            {
                dom.byId("btnMakeManager").innerHTML = "Make Manager";
            }

            if (data.newMember)
            {
                dom.byId("btnRemoveInvite").innerHTML = "Invite";
            }
            else
            {
                dom.byId("btnRemoveInvite").innerHTML = "Remove";
            }
        };

        var removeMember = function()
        {
            if (dom.byId("btnRemoveInvite").disabled) return;

            if (currentMemberItem.userItem.newMember)
            {
                dom.byId("btnRemoveInvite").disabled = true;
                createInvitation();
            }
            else
            {
                var manager_list = members.filter(function(user) {
                    return (user.role == "manager" && user.status == "accepted");
                });

                if (manager_list.length == 1) {
                    var last_manager_name = manager_list[0]["user"]["display_name"];
                    annoUtil.showMessageDialog(last_manager_name + " is only active manager for this community. This user can't be removed.");
                    return;
                }

            	annoUtil.showConfirmMessageDialog("Are you sure?", function(ret){
                    if (ret)
                    {
                        dom.byId("btnRemoveInvite").disabled = true;
                        var currentUser = currentMemberItem.userItem.user;
                        doRemoveMember(currentCommunity.community.id, currentUser.id, currentUser.user_email);
                    }
                });

            }
        };

        var createInvitation = function()
        {
            annoUtil.showLoadingIndicator();
            annoUtil.loadAPI(annoUtil.API.community, function(){
                var createInvite = gapi.client.community.invite.create({
                    community:currentCommunity.community.id,
                    email:currentMemberItem.userItem.user.user_email,
                    invite_msg:currentCommunity.community.welcome_msg,
                    name:currentMemberItem.userItem.user.display_name,
                    role:currentMemberItem.userItem.role
                });
                createInvite.execute(function (data)
                {
                    if (!data)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showToastDialog("Response returned from server are empty.");
                        dom.byId("btnRemoveInvite").disabled = false;
                        return;
                    }

                    if (data.error)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showMessageDialog("An error occurred when calling community.invite.create api: "+data.error.message);
                        dom.byId("btnRemoveInvite").disabled = false;
                        return;
                    }

                    dom.byId("btnRemoveInvite").disabled = false;
                    currentMemberItem.userItem.newMember = false;
                    showMemberDetail(currentMemberItem);

                    window.plugins.socialsharing.shareViaEmail(
                        dojoString.substitute(invitationEmailTemplate.replace(/[\r\n]/g, ""), data.result),
                        "UserSource Invitation",
                        [data.result.user_email],
                        null, // CC: must be null or an array
                        null, // BCC: must be null or an array
                        null, // FILES: can be null, a string, or an array
                        function (a)
                        {
                        },
                        function (a)
                        {
                        }
                    );

                    annoUtil.hideLoadingIndicator();
                });
            });
        };

        var doRemoveMember = function(communityId, userId, userEmail)
        {
            annoUtil.showLoadingIndicator();
            annoUtil.loadAPI(annoUtil.API.community, function(){
                var deleteUser = gapi.client.community.user.delete({
                    community_id : communityId,
                    user_id : userId,
                    user_email: userEmail,
                    include_invite : true
                });
                deleteUser.execute(function (data)
                {
                    if (!data)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showToastDialog("Response returned from server are empty.");
                        dom.byId("btnRemoveInvite").disabled = false;
                        return;
                    }

                    if (data.error)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showMessageDialog("An error occurred when calling community.user.delete api: "+data.error.message);
                        dom.byId("btnRemoveInvite").disabled = false;
                        return;
                    }

                    domStyle.set("memberDetailContainer", "display", "none");
                    domConstruct.place("memberDetailContainer", "listContainerCommunity", "after");
                    currentMemberItem.destroy();
                    members.splice(array.indexOf(members, currentMemberItem.userItem), 1);
                    dom.byId("btnRemoveInvite").disabled = false;

                    annoUtil.hideLoadingIndicator();
                });
            });
        };

        var toggleMemberRole = function()
        {
            var role = "member";
            if (currentMemberItem.userItem.role == "member")
            {
                role = "manager";
            }

            if (role == "member") {
                var manager_list = members.filter(function(user) {
                    return (user.role == "manager" && user.status == "accepted");
                });

                if (manager_list.length == 1) {
                    var last_manager_name = manager_list[0]["user"]["display_name"];
                    annoUtil.showMessageDialog(last_manager_name + " is only active manager for this community. This user's role can't be changed.");
                    return;
                }
            }

            function _toggleMemberRoleUI()
            {
                if (currentMemberItem.userItem.role == "member")
                {
                    currentMemberItem.userItem.role = "manager";
                    dom.byId("btnMakeManager").innerHTML = "Make Member";
                    domStyle.set(query(".icon-bolt", currentMemberItem.domNode)[0], "display", "");
                }
                else
                {
                    currentMemberItem.userItem.role = "member";
                    dom.byId("btnMakeManager").innerHTML = "Make Manager";
                    domStyle.set(query(".icon-bolt", currentMemberItem.domNode)[0], "display", "none");
                }

                dom.byId("memberDetailRole").innerHTML = currentMemberItem.userItem.role;
            }

            if (currentMemberItem.userItem.newMember)
            {
                _toggleMemberRoleUI();
                return;
            }

            dom.byId("btnMakeManager").disabled = true;

            annoUtil.showLoadingIndicator();
            annoUtil.loadAPI(annoUtil.API.community, function(){
                var editUserRole = gapi.client.community.user.edit_role({
                    community_id : currentCommunity.community.id,
                    user_id : currentMemberItem.userItem.user.id,
                    user_email: currentMemberItem.userItem.user.user_email,
                    role : role,
                    include_invite : true
                });
                editUserRole.execute(function (data)
                {
                    if (!data)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showToastDialog("Response returned from server are empty.");
                        dom.byId("btnMakeManager").disabled = false;
                        return;
                    }

                    if (data.error)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showMessageDialog("An error occurred when calling community.user.edit_role api: " + data.error.message);
                        dom.byId("btnMakeManager").disabled = false;
                        return;
                    }

                    _toggleMemberRoleUI();
                    dom.byId("btnMakeManager").disabled = false;
                    annoUtil.hideLoadingIndicator();
                });
            });
        };

        var searchAnnoByCommunity = function()
        {
            app.transitionToView(document.getElementById('modelApp_community'), {target:'searchAnno',url:'#searchAnno', params:{tag:dom.byId("headerTitleCommunity").innerHTML, communityId:currentCommunity.community.id}});
        };

        var inviteNewMember = function()
        {
            window.plugins.PickContact.chooseContact(function(contact){
                var newMember = {
                    "user":{
                        "display_name": contact.displayName,
                        "user_email": contact.emailAddress
                    },
                    "status": "pending",
                    "role": "member",
                    "newMember": true
                };

                members.push(newMember);

                var newMemberItem = new ListItem({
                    variableHeight:true,
                    clickable:false,
                    noArrow:true,
                    _duration:0,
                    userItem: newMember,
                    "class": "row listAppName"
                });
                registry.byId('communityUserList').addChild(newMemberItem, registry.byId('communityUserList').getChildren().length-1);
                newMemberItem.domNode.innerHTML = '<div><span class="icon-busy annoOrangeColor" style="font-weight: bold"></span>&nbsp;<span>'+newMember.user.display_name+'</span>&nbsp;<span class="icon-bolt annoOrangeColor" style="font-weight: bold;display: none"></span></div>'
                showMemberDetail(newMemberItem);
                connect.connect(newMemberItem.domNode, 'click', newMemberItem,function(e)
                {
                    dojo.stopEvent(e);
                    showMemberDetail(this);
                });

            },function(err){
                console.log('Error: ' + err);
            });
        };

        var saveWelcomeMsg = function(msg)
        {
            dom.byId("btnSaveWelcomeMsg").disabled = true;
            dom.byId("btnCancelWelcomeMsg").disabled = true;

            annoUtil.showLoadingIndicator();
            annoUtil.loadAPI(annoUtil.API.community, function(){
                var editWelcomeMsg = gapi.client.community.community.edit_welcome_msg({id:currentCommunity.community.id, welcome_msg: msg});
                editWelcomeMsg.execute(function (data)
                {
                    if (!data)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showToastDialog("Response returned from server are empty.");
                        dom.byId("btnSaveWelcomeMsg").disabled = false;
                        dom.byId("btnCancelWelcomeMsg").disabled = false;
                        return;
                    }

                    if (data.error)
                    {
                        annoUtil.hideLoadingIndicator();
                        annoUtil.showMessageDialog("An error occurred when calling community.edit_welcome_message api: "+data.error.message);
                        dom.byId("btnSaveWelcomeMsg").disabled = false;
                        dom.byId("btnCancelWelcomeMsg").disabled = false;
                        return;
                    }

                    dom.byId("btnSaveWelcomeMsg").disabled = false;
                    dom.byId("btnCancelWelcomeMsg").disabled = false;

                    dom.byId("communityWelMsg").innerHTML = msg;
                    domStyle.set("btnSaveWelcomeMsgContainer", "display", "none");
                    oldWelcomeMsg = "";
                    currentCommunity.community.welcome_msg = msg;

                    annoUtil.hideLoadingIndicator();
                });
            });
        };

        return {
            // simple view init
            init:function ()
            {
                app = this.app;
                adjustSize();

                _connectResults.push(connect.connect(dom.byId("btnRemoveInvite"), 'click', function(e)
                {
                    dojo.stopEvent(e);
                    removeMember();
                }));

                _connectResults.push(connect.connect(dom.byId("btnMakeManager"), 'click', function(e)
                {
                    dojo.stopEvent(e);
                    toggleMemberRole();
                }));

                _connectResults.push(connect.connect(dom.byId("communityActivity"), 'click', function(e)
                {
                    searchAnnoByCommunity();
                }));

                _connectResults.push(connect.connect(dom.byId("communityWelMsg"), 'focus', function(e)
                {
                    if (!oldWelcomeMsg)
                    {
                        oldWelcomeMsg = dom.byId("communityWelMsg").innerHTML;
                    }
                }));

                _connectResults.push(connect.connect(dom.byId("communityWelMsg"), 'blur', function(e)
                {
                    if (oldWelcomeMsg != dom.byId("communityWelMsg").innerHTML)
                    {
                        domStyle.set("btnSaveWelcomeMsgContainer", "display", "");
                    }
                    else
                    {
                        domStyle.set("btnSaveWelcomeMsgContainer", "display", "none");
                    }
                }));

                _connectResults.push(connect.connect(dom.byId("btnSaveWelcomeMsg"), 'click', function(e)
                {
                    saveWelcomeMsg(dom.byId("communityWelMsg").innerHTML);
                }));

                _connectResults.push(connect.connect(dom.byId("btnCancelWelcomeMsg"), 'click', function(e)
                {
                    dojo.stopEvent(e);
                    dom.byId("communityWelMsg").innerHTML = oldWelcomeMsg;
                    domStyle.set("btnSaveWelcomeMsgContainer", "display", "none");
                    oldWelcomeMsg = "";
                }));
            },
            afterActivate: function()
            {
                var idx = this.params["index"];
                loadCommunityDetails(idx);
                app.isBackwardFired();
            },
            beforeDeactivate: function()
            {
                domStyle.set("memberDetailContainer", "display", "none");
                domConstruct.place("memberDetailContainer", "listContainerCommunity", "after");
                var itemList = registry.byId('communityUserList');
                itemList.destroyDescendants();
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