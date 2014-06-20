define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/_base/array",
    "dojo/_base/connect",
    "dojo/query",
    "dojo/window",
    "dijit/registry",
    "dojox/mobile/ListItem",
    "anno/common/Util",
    "dojo/request/xhr"
],
    function (dom, domClass, domConstruct, domStyle, array, connect, query, win, registry, ListItem, annoUtil, xhr)
    {
        var _connectResults = []; // events connect results
        var app = null;
        var currentMemberItem, members, currentCommunity;

        var adjustSize = function()
        {
            var viewPoint = win.getBox();

            domStyle.set("listContainerCommunity", "height", (viewPoint.h-48)+"px");
        };

        var loadCommunityDetails = function(idx)
        {
            var communities = annoUtil.getUserCommunities(), community = currentCommunity = communities[idx];
            dom.byId("headerTitleCommunity").innerHTML = community.name;
            dom.byId("communityWelMsg").innerHTML = community.welcome_msg;
            dom.byId("communityActivity").innerHTML = community.name+" activity";

            var self = this;

            xhr.get('../../scripts/dummyData/community.user.list.json',
                {
                    handleAs: "json"
                }).then(function (data)
                {
                    drawUserList(data.result);
                },
                function (res)
                {

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
                if (itemData.status == "Accepted")
                {
                    template = '<span class="icon-checkmark annoOrangeColor" style="font-weight: bold"></span>';
                }
                else
                {
                    template = '<span class="icon-busy annoOrangeColor" style="font-weight: bold"></span>';
                }

                template = template + '&nbsp;<span>'+itemData.display_name+'</span>';

                if (itemData.role == "Manager")
                {
                    template = template + '&nbsp;<span class="icon-bolt annoOrangeColor" style="font-weight: bold"></span>';
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

            dom.byId("memberDetailEmail").innerHTML = data.user_email;
            dom.byId("memberDetailFullName").innerHTML = data.user_full_name;
            dom.byId("memberDetailStatus").innerHTML = data.status;
            dom.byId("memberDetailRole").innerHTML = data.role;

            if (data.role == "Manager")
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
            if (currentMemberItem.userItem.newMember)
            {
                var emailTemplate = '<div>Hi '+currentMemberItem.userItem.display_name+',</div><h5>'+currentCommunity.welcome_msg+'</h5><div>Thanks,<br>UserSource Support</div>';
                window.plugins.socialsharing.shareViaEmail(
                    emailTemplate,
                    'Invitation from '+currentCommunity.name,
                    [currentMemberItem.userItem.user_email],
                    null, // CC: must be null or an array
                    null, // BCC: must be null or an array
                    null, // FILES: can be null, a string, or an array
                    function(a){},
                    function(a){}
                );
            }
            else
            {
                domStyle.set("memberDetailContainer", "display", "none");
                domConstruct.place("memberDetailContainer", "listContainerCommunity", "after");
                currentMemberItem.destroy();
                members.splice(array.indexOf(members, currentMemberItem.userItem), 1);
            }
        };

        var toggleMemberRole = function()
        {
            if (currentMemberItem.userItem.role == "Member")
            {
                currentMemberItem.userItem.role = "Manager";
                dom.byId("btnMakeManager").innerHTML = "Make Member";
            }
            else
            {
                currentMemberItem.userItem.role = "Member";
                dom.byId("btnMakeManager").innerHTML = "Make Manager";
            }

            dom.byId("memberDetailRole").innerHTML = currentMemberItem.userItem.role;
        };

        var searchAnnoByCommunity = function()
        {
            app.transitionToView(document.getElementById('modelApp_community'), {target:'searchAnno',url:'#searchAnno', params:{tag:dom.byId("headerTitleCommunity").innerHTML}});
        };

        var inviteNewMember = function()
        {
            window.plugins.PickContact.chooseContact(function(contact){
                var newMember = {
                    "display_name": contact.displayName,
                    "user_full_name":contact.nameFormated,
                    "user_email": contact.emailAddress,
                    "status": "Pending",
                    "role": "Member",
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
                newMemberItem.domNode.innerHTML = '<div><span class="icon-busy annoOrangeColor" style="font-weight: bold"></span>&nbsp;<span>'+newMember.display_name+'</span></div>'
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