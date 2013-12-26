define([
    "dojo/_base/array",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/query",
    "dojo/touch",
    "dojo/_base/lang",
    "dojo/_base/connect",
    "dojo/window",
    "dojo/has",
    "dojo/sniff",
    "dijit/registry",
    "dojox/mvc/at",
    "dojo/store/Memory",
    "dojox/mvc/getStateful",
    "anno/common/DBUtil",
    "anno/common/Util",
    "anno/common/OAuthUtil",
    "anno/anno/AnnoDataHandler"
],
    function (arrayUtil, dom, domClass, domGeom, domStyle, query, touch, lang, connect, win, has, sniff, registry, at, Memory, getStateful, DBUtil, annoUtil, OAuthUtil, AnnoDataHandler)
    {
        var _connectResults = []; // events connect results
        var eventsModel = null;
        var app = null;
        var listScrollTop = 0;
        var loadingMoreData = false,
            offset = 0, limit=30;
        var hasMoreData = false;
        var topBarHeight=48, bottomBarHeight = 50;
        var emptyAnno = {
            "id": 0,
            "annoText": "0",
            "app": "0",
            "author": "0",
            "screenshot":"0",
            circleX: 0,
            circleY:0,
            level:1,
            deviceInfo:" ",
            comments:[{
                author:'',
                comment:''
            }]
        };

        var loadListData = function (poffset)
        {
            annoUtil.hasConnection();
            if (poffset)
            {
                loadingMoreData = true;
            }
            annoUtil.showLoadingIndicator();

            var arg = {outcome: 'cursor,has_more,anno_list', limit: limit}

            if (poffset)
            {
                arg.cursor = poffset;
            }

            var getAnnoList = gapi.client.anno.anno.list(arg);
            getAnnoList.execute(function (data)
            {
                if (!data)
                {
                    annoUtil.hideLoadingIndicator();
                    loadingMoreData = false;
                    alert("Annos returned from server are empty.");
                    return;
                }

                if (data.error)
                {
                    annoUtil.hideLoadingIndicator();
                    loadingMoreData = false;

                    alert("An error occurred when calling anno.list api: "+data.error.message);
                    return;
                }

                var annoList = data.result.anno_list||[];

                var spliceArgs = [eventsModel.model.length, 0];
                for (var i = 0, l = annoList.length; i < l; i++)
                {
                    var eventData = lang.clone(emptyAnno);

                    eventData.annoText = annoList[i].anno_text;
                    eventData.annoType = annoList[i].anno_type;
                    eventData.annoIcon = annoList[i].anno_type == annoUtil.annoType.SimpleComment?"icon-simplecomment":"icon-shapes";
                    eventData.app = annoList[i].app_name;
                    eventData.author = annoList[i].creator?annoList[i].creator.display_name||annoList[i].creator.user_email||annoList[i].creator.user_id:"";
                    eventData.id = annoList[i].id;
                    eventData.circleX = parseInt(annoList[i].simple_x, 10);
                    eventData.circleY = parseInt(annoList[i].simple_y, 10);
                    eventData.simple_circle_on_top = annoList[i].simple_circle_on_top;

                    spliceArgs.push(new getStateful(eventData));
                }

                eventsModel.model.splice.apply(eventsModel.model, spliceArgs);

                annoUtil.hideLoadingIndicator();
                loadingMoreData = false;

                if (poffset)
                {
                    offset = poffset;
                }

                hasMoreData = data.result.has_more;
                offset = data.result.cursor;
            });
        };

        var loadMoreData = function()
        {
            if (loadingMoreData||!hasMoreData) return;

            loadListData(offset);

            adjustSize();
        };

        var adjustSize = function()
        {
            var viewPoint = win.getBox();

            domStyle.set("listContainerStart", "height", (viewPoint.h-topBarHeight-bottomBarHeight)+"px");

            // reposition the menus dialog
            var menusDialog = registry.byId('menusDialog');
            menusDialog.top = (viewPoint.h-bottomBarHeight-120)+'px';
            menusDialog.left = (viewPoint.w-304)+'px';
        };

        var goBackActivity = function()
        {
            cordova.exec(
                function (data)
                {

                },
                function (err)
                {
                    alert(err);
                },
                "AnnoCordovaPlugin",
                'exit_current_activity',
                []
            );
        };

        var exitApp = function()
        {
            navigator.app.exitApp();
        };

        var _init = function()
        {
            if (DBUtil.userChecked)
            {
                var authResult = OAuthUtil.isAuthorized();
                if (!authResult.authorized)
                {
                    OAuthUtil.openAuthPage();
                    return;
                }
                else
                {
                    AnnoDataHandler.getCurrentUserInfo(function(userInfo){

                        if (userInfo.signinMethod == OAuthUtil.signinMethod.anno)
                        {
                            if (authResult.newUser)
                            {
                                annoUtil.startActivity("Intro", false);
                            }

                            OAuthUtil.processBasicAuthToken(userInfo);
                        }

                        annoUtil.showLoadingIndicator();
                        OAuthUtil.getAccessToken(function(){
                            annoUtil.loadAPI(annoUtil.API.anno, loadListData);
                            AnnoDataHandler.startBackgroundSync();
                        });
                    });

                    _connectResults.push(connect.connect(dom.byId("barMyStuff"), 'click', function(e)
                    {
                        dojo.stopEvent(e);
                        app.transitionToView(document.getElementById('modelApp_home'), {target:'myStuff',url:'#myStuff'});
                    }));

                    _connectResults.push(connect.connect(dom.byId("menuItemSettings"), 'click', function(e)
                    {
                        {
                            domClass.remove("barMenus", 'barIconHighlight');
                            registry.byId('menusDialog').hide();
                            app.transitionToView(document.getElementById('modelApp_home'), {target:'settings',url:'#settings'});
                        }
                    }));

                    _connectResults.push(connect.connect(dom.byId("menuItemIntro"), 'click', function(e)
                    {
                        annoUtil.startActivity("Intro", false);
                    }));

                    _connectResults.push(connect.connect(dom.byId("menuItemFeedback"), 'click', function(e)
                    {
                        annoUtil.startActivity("Feedback", false);
                    }));

                    _connectResults.push(connect.connect(dom.byId("barMenus"), 'click', function(e)
                    {
                        var menusDialog = registry.byId('menusDialog');
                        if (menusDialog.domNode.style.display === "")
                        {
                            registry.byId('menusDialog').hide();
                            domClass.remove("barMenus", 'barIconHighlight');
                        }
                        else
                        {
                            var viewPoint = win.getBox();
                            registry.byId('menusDialog').show();
                            domStyle.set(menusDialog._cover[0], {"height": (viewPoint.h-topBarHeight-bottomBarHeight)+"px", top:(topBarHeight)+"px"});
                            domClass.add("barMenus", 'barIconHighlight');
                        }
                    }));

                    _connectResults.push(connect.connect(dom.byId('btnLoadListData'), "click", function ()
                    {
                        loadListData();
                    }));

                    _connectResults.push(connect.connect(dom.byId('navBtnBackStart'), "click", function ()
                    {
                        goBackActivity();
                    }));

                    _connectResults.push(connect.connect(window, has("ios") ? "orientationchange" : "resize", this, function (e)
                    {
                        adjustSize();
                    }));

                    _connectResults.push(connect.connect(dom.byId('listContainerStart'), "scroll", this, function(){
                        var toEnd = false;
                        var listContainer = dom.byId('listContainerStart');
                        if ((listContainer.clientHeight + listContainer.scrollTop) >= listContainer.scrollHeight) toEnd = true;

                        if (toEnd)
                        {
                            loadMoreData();
                        }
                    }));

                    adjustSize();
                }
            }
            else
            {
                window.setTimeout(_init, 20);
            }
        };

        return {
            // simple view init
            init:function ()
            {
                eventsModel = this.loadedModels.events;
                app = this.app;

                _init();
            },
            afterActivate: function()
            {
                adjustSize();
                var listContainer = dom.byId('listContainerStart');
                listContainer.scrollTop = listScrollTop;

                document.addEventListener("backbutton", exitApp, false);
            },
            beforeDeactivate: function()
            {
                var listContainer = dom.byId('listContainerStart');
                listScrollTop = listContainer.scrollTop;

                registry.byId('menusDialog').hide();
                domClass.remove("barMenus", 'barIconHighlight');
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

                document.removeEventListener("backbutton", exitApp, false);
            }
        }
    });