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
            offset = 0, limit=30, searchOffset = 0;
        var hasMoreData = false,
            hasMoreSearchData = false,
            inSearchMode = false,
            selectedAppName = "",
            searchDone = false;
        var SEARCH_ORDER = {
            RECENT: "recent",
            ACTIVE: "active",
            POPULAR: "popular"
        };
        var searchOrder = SEARCH_ORDER.RECENT, originalData = null, appNameList = null;
        var topBarHeight=48,
            bottomBarHeight = 50,
            appNameDialogGap = 80,
            searchAppNameContainerHeight = 26,
            searchSortsBarHeight = 26;
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

        var sdTitleHeight = 100,
            sdBottom = 90;
        var viewPoint;

        var loadListData = function (search, poffset, order, clearData)
        {
            search = search == null?false:search;
            clearData = clearData == null?false:clearData;
            annoUtil.hasConnection();
            if (poffset)
            {
                loadingMoreData = true;
            }
            annoUtil.showLoadingIndicator();

            var arg = {outcome: 'cursor,has_more,anno_list', limit: limit};

            if (search)
            {
                arg.order_type = order||SEARCH_ORDER.RECENT;
                arg.search_string = dom.byId("txtSearchAnno").value;

                if (selectedAppName)
                {
                    arg.app_name = selectedAppName;
                }
            }

            if (poffset)
            {
                if (search)
                {
                    arg.offset = poffset;
                }
                else
                {
                    arg.cursor = poffset;
                }
            }

            console.error("anno "+(search?"search":"list")+"ing, args:"+JSON.stringify(arg));
            var getAnnoList = search?gapi.client.anno.anno.search(arg):gapi.client.anno.anno.list(arg);
            getAnnoList.execute(function (data)
            {
                if (!data)
                {
                    annoUtil.hideLoadingIndicator();
                    loadingMoreData = false;
                    domStyle.set('noSearchResultContainer', 'display', 'none');
                    alert("Annos returned from server are empty.");
                    return;
                }

                if (data.error)
                {
                    annoUtil.hideLoadingIndicator();
                    loadingMoreData = false;
                    domStyle.set('noSearchResultContainer', 'display', 'none');
                    alert("An error occurred when calling anno."+(search?"search":"list")+" api: "+data.error.message);
                    return;
                }

                var annoList = data.result.anno_list||[];

                var spliceArgs = clearData?[0, eventsModel.model.length]:[eventsModel.model.length, 0];
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

                if (clearData&&originalData == null)
                {
                    originalData = eventsModel.model.splice.apply(eventsModel.model, spliceArgs);
                }
                else
                {
                    eventsModel.model.splice.apply(eventsModel.model, spliceArgs);
                }

                annoUtil.hideLoadingIndicator();
                loadingMoreData = false;

                if (search)
                {
                    searchDone = true;
                    searchOffset = data.result.offset;
                    hasMoreSearchData = data.result.has_more;

                    if (order)
                    {
                        domClass.remove(dom.byId("searchSortsBarRecent").parentNode);
                        domClass.remove(dom.byId("searchSortsBarActive").parentNode);
                        domClass.remove(dom.byId("searchSortsBarPopular").parentNode);

                        if (order == SEARCH_ORDER.RECENT)
                        {
                            domClass.add(dom.byId("searchSortsBarRecent").parentNode, "searchSortItemActive");
                        }
                        else if (order == SEARCH_ORDER.ACTIVE)
                        {
                            domClass.add(dom.byId("searchSortsBarActive").parentNode, "searchSortItemActive");
                        }
                        else if (order == SEARCH_ORDER.POPULAR)
                        {
                            domClass.add(dom.byId("searchSortsBarPopular").parentNode, "searchSortItemActive");
                        }
                    }

                    if (clearData&&annoList.length <=0)
                    {
                        domStyle.set('noSearchResultContainer', 'display', '');
                    }
                    else
                    {
                        domStyle.set('noSearchResultContainer', 'display', 'none');
                    }

                }
                else
                {
                    offset = data.result.cursor;
                    hasMoreData = data.result.has_more;
                }
            });
        };

        var loadMoreData = function()
        {
            if (loadingMoreData) return;
            if (!hasMoreData&&!(inSearchMode&&searchDone)) return;
            if (!hasMoreSearchData&&(inSearchMode&&searchDone)) return;

            if (inSearchMode&&searchDone)
            {
                loadListData(true, searchOffset, searchOrder);
            }
            else
            {
                loadListData(false, offset);
            }

            //adjustSize();
        };

        var adjustSize = function()
        {
            viewPoint = win.getBox();

            domStyle.set("listContainerStart", "height", (viewPoint.h-topBarHeight)+"px");

            // reposition the menus dialog
            var menusDialog = registry.byId('menusDialog');
            menusDialog.top = topBarHeight+'px';
            menusDialog.left = (viewPoint.w-204)+'px';

            // set share dialog size
            domStyle.set('appNameDialog', {
                width: (viewPoint.w-appNameDialogGap)+'px',
                height: (viewPoint.h-appNameDialogGap)+'px'
            });

            domStyle.set('sdTitle', 'height', sdTitleHeight+'px');
            domStyle.set('sdAppList', 'height', (viewPoint.h-sdTitleHeight-sdBottom-appNameDialogGap)+'px');
            domStyle.set('sdBottom', 'height', sdBottom+'px');
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
            var menusDialog = registry.byId('menusDialog'), appNameDialog = registry.byId('appNameDialog');

            if (menusDialog.domNode.style.display == "")
            {
                hideMenuDialog();
            }
            else if (appNameDialog.domNode.style.display == "")
            {
                hideAppNameDialog();
            }
            else if (inSearchMode)
            {
                cancelSearch();
            }
            else
            {
                navigator.app.exitApp();
            }
        };

        var cancelSearch = function()
        {
            if (originalData)
            {
                originalData.splice(0,0, 0, originalData.length);
                eventsModel.model.splice.apply(eventsModel.model, [0,eventsModel.model.length]);
                eventsModel.model.splice.apply(eventsModel.model, originalData);
                originalData = null;
            }

            domStyle.set('navBtnBackHome', 'display', 'none');
            domStyle.set('navLogoTextHome', 'display', '');
            domStyle.set('tdBarMyStuff', 'display', '');
            domStyle.set('tdbarSearchAnno', 'display', '');
            domStyle.set('txtSearchAnno', 'display', 'none');
            dom.byId("txtSearchAnno").value = "";
            domStyle.set('tdHeadingLeft', 'width', '212px');
            domStyle.set('annoLogoHome', 'paddingLeft', '10px');
            domStyle.set('searchSortsBarHome', 'display', 'none');

            domStyle.set("listContainerStart", "height", (viewPoint.h-topBarHeight)+"px");
            domStyle.set('noSearchResultContainer', 'display', 'none');
            domStyle.set('searchAppNameContainer', 'display', 'none');
            dom.byId('searchAppName').innerHTML = "";

            domClass.remove(dom.byId("searchSortsBarRecent").parentNode);
            domClass.remove(dom.byId("searchSortsBarActive").parentNode);
            domClass.remove(dom.byId("searchSortsBarPopular").parentNode);
            domClass.add(dom.byId("searchSortsBarRecent").parentNode, "searchSortItemActive");

            searchOrder = SEARCH_ORDER.RECENT;

            selectedAppName = "";

            inSearchMode = false;
            searchDone = false;
        };

        var hideMenuDialog = function()
        {
            var menusDialog = registry.byId('menusDialog');

            if (!menusDialog) return;
            menusDialog.hide();

            if (menusDialog._cover[0])
            {
                domClass.remove(menusDialog._cover[0], "transparentBack");
                domStyle.set(menusDialog._cover[0], {"height": "100%", top:"0px"});
            }

            domClass.remove("barMoreMenuHome", 'barMoreMenuActive');
        };

        var showMenuDialog = function()
        {
            var viewPoint = win.getBox();

            var menusDialog = registry.byId('menusDialog');
            menusDialog.show();
            domClass.add(menusDialog._cover[0], "transparentBack");
            domStyle.set(menusDialog._cover[0], {"height": (viewPoint.h-topBarHeight)+"px", top:topBarHeight+"px"});

            domClass.add("barMoreMenuHome", 'barMoreMenuActive');
        };

        var showAppNameDialog = function()
        {
            var appNameDialog = registry.byId('appNameDialog');
            appNameDialog.show();

            dom.byId('btnAppNameDialogDone').disabled = true;
            domClass.add('btnAppNameDialogDone', "disabledBtn");
            dom.byId('txtSearchAppName').value = "";
            selectedAppName = "";

            if (appNameList == null)
            {
                cordova.exec(
                    function (result)
                    {
                        if (result&&result.length>0)
                        {
                            appNameList = result;
                            fillAppNameList(result);
                        }
                    },
                    function (err)
                    {
                        alert(err.message);
                    },
                    "AnnoCordovaPlugin",
                    'get_installed_app_list',
                    []
                );
            }
            else
            {
                fillAppNameList(appNameList);
            }
        };

        var fillAppNameList = function(appList)
        {
            var content = "", appItem = null;
            for (var i= 0,c=appList.length;i<c;i++)
            {
                appItem = appList[i];
                if (i == 0)
                {
                    content = content + '<div class="appNameItem firstAppNameItem"><div class="appNameValue">'+appItem.name+'</div></div>'
                }
                else
                {
                    content = content + '<div class="appNameItem"><div class="appNameValue">'+appItem.name+'</div></div>'
                }
            }

            dom.byId('sdAppListContent').innerHTML = content;
        };

        var hideAppNameDialog = function()
        {
            var appNameDialog = registry.byId('appNameDialog');

            if (!appNameDialog) return;
            appNameDialog.hide();
        };

        var doFilterAppName = function()
        {
            var appName = dom.byId("txtSearchAppName").value.trim(), matchedAppNameList = [];
            selectedAppName = "";

            if (appName.length > 0)
            {
                for (var i= 0,c=appNameList.length;i<c;i++)
                {
                    if (appNameList[i].name.indexOf(appName) >=0)
                    {
                        matchedAppNameList.push(appNameList[i]);
                    }
                }

                fillAppNameList(matchedAppNameList);
            }
            else
            {
                fillAppNameList(appNameList);
            }

            if (appName.length <=0)
            {
                dom.byId('btnAppNameDialogDone').disabled = true;
                domClass.add('btnAppNameDialogDone', "disabledBtn");
            }
        };

        var onChkLimitToMyApps = window.onChkLimitToMyApps = function()
        {
            fillAppNameList(appNameList);
            dom.byId('btnAppNameDialogDone').disabled = true;
            domClass.add('btnAppNameDialogDone', "disabledBtn");
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

                        if (authResult.newUser)
                        {
                            annoUtil.startActivity("Intro", false);
                        }

                        if (userInfo.signinMethod == OAuthUtil.signinMethod.anno)
                        {
                            OAuthUtil.processBasicAuthToken(userInfo);
                        }

                        annoUtil.showLoadingIndicator();
                        OAuthUtil.getAccessToken(function(){
                            annoUtil.loadAPI(annoUtil.API.anno, loadListData);

                            window.setTimeout(function(){
                                AnnoDataHandler.startBackgroundSync();
                            }, 5*1000);
                        });
                    });

                    _connectResults.push(connect.connect(dom.byId("barMyStuff"), 'click', function(e)
                    {
                        dojo.stopEvent(e);
                        hideMenuDialog();

                        app.transitionToView(document.getElementById('modelApp_home'), {target:'myStuff',url:'#myStuff'});
                    }));

                    _connectResults.push(connect.connect(dom.byId("tdbarSearchAnno"), 'click', function(e)
                    {
                        hideMenuDialog();

                        domStyle.set("listContainerStart", "height", (viewPoint.h-topBarHeight-searchSortsBarHeight)+"px");

                        domStyle.set('navBtnBackHome', 'display', '');
                        domStyle.set('navLogoTextHome', 'display', 'none');
                        domStyle.set('tdBarMyStuff', 'display', 'none');
                        domStyle.set('tdbarSearchAnno', 'display', 'none');
                        domStyle.set('txtSearchAnno', 'display', '');
                        domStyle.set('tdHeadingLeft', 'width', '95px');
                        domStyle.set('annoLogoHome', 'paddingLeft', '0px');
                        domStyle.set('searchSortsBarHome', 'display', '');

                        dom.byId('txtSearchAnno').focus();
                        inSearchMode = true;
                        dojo.stopEvent(e);

                    }));

                    _connectResults.push(connect.connect(dom.byId("barMoreMenuHome"), 'click', function(e)
                    {
                        if (inSearchMode)
                        {
                            window.setTimeout(function(){
                                showAppNameDialog();
                            }, 500);
                        }
                        else
                        {
                            var menusDialog = registry.byId('menusDialog');
                            if (menusDialog.domNode.style.display === "")
                            {
                                hideMenuDialog();
                            }
                            else
                            {
                                showMenuDialog();
                            }
                        }
                    }));

                    _connectResults.push(connect.connect(dom.byId("tdLogo"), 'click', function(e)
                    {
                        cancelSearch();
                    }));

                    _connectResults.push(connect.connect(dom.byId("menuItemSettings"), 'click', function(e)
                    {
                        hideMenuDialog();
                        app.transitionToView(document.getElementById('modelApp_home'), {target: 'settings', url: '#settings'});
                    }));

                    _connectResults.push(connect.connect(dom.byId("menuItemIntro"), 'click', function(e)
                    {
                        hideMenuDialog();

                        annoUtil.startActivity("Intro", false);
                    }));

                    _connectResults.push(connect.connect(dom.byId("menuItemFeedback"), 'click', function(e)
                    {
                        hideMenuDialog();

                        annoUtil.startActivity("Feedback", false);
                    }));

                    _connectResults.push(connect.connect(dom.byId('btnLoadListData'), "click", function ()
                    {
                        loadListData();
                    }));

                    _connectResults.push(connect.connect(dom.byId('navBtnBackStart'), "click", function ()
                    {
                        goBackActivity();
                    }));

                    _connectResults.push(connect.connect(dom.byId('searchSortsBarRecent'), "click", function ()
                    {
                        if (domClass.contains(dom.byId('searchSortsBarRecent').parentNode, 'searchSortItemActive'))
                        {
                            return;
                        }

                        searchOrder = SEARCH_ORDER.RECENT;
                        loadListData(true, null, SEARCH_ORDER.RECENT, true);
                    }));

                    _connectResults.push(connect.connect(dom.byId('searchSortsBarActive'), "click", function ()
                    {
                        if (domClass.contains(dom.byId('searchSortsBarActive').parentNode, 'searchSortItemActive'))
                        {
                            return;
                        }

                        searchOrder = SEARCH_ORDER.ACTIVE;
                        loadListData(true, null, SEARCH_ORDER.ACTIVE, true);
                    }));

                    _connectResults.push(connect.connect(dom.byId('searchSortsBarPopular'), "click", function ()
                    {
                        if (domClass.contains(dom.byId('searchSortsBarPopular').parentNode, 'searchSortItemActive'))
                        {
                            return;
                        }

                        searchOrder = SEARCH_ORDER.POPULAR;
                        loadListData(true, null, SEARCH_ORDER.POPULAR, true);
                    }));

                    _connectResults.push(connect.connect(dom.byId('txtSearchAnno'), "keydown", function (e)
                    {
                        if (e.keyCode == 13)
                        {
                            dom.byId("hiddenBtn").focus();
                            loadListData(true, null, searchOrder, true);
                        }
                    }));

                    _connectResults.push(connect.connect(dom.byId('btnAppNameDialogCancel'), "click", function ()
                    {
                        hideAppNameDialog();
                    }));

                    _connectResults.push(connect.connect(dom.byId('txtSearchAppName'), "keydown", function (e)
                    {
                        if (e.keyCode == 13)
                        {
                            dom.byId("hiddenBtn").focus();
                            doFilterAppName();
                        }
                    }));

                    _connectResults.push(connect.connect(dom.byId('txtSearchAppName'), "input", function (e)
                    {
                        if (dom.byId('txtSearchAppName').value.trim().length >0)
                        {
                            dom.byId('btnAppNameDialogDone').disabled = false;
                            domClass.remove('btnAppNameDialogDone', "disabledBtn");
                        }
                        else
                        {
                            dom.byId('btnAppNameDialogDone').disabled = true;
                            domClass.add('btnAppNameDialogDone', "disabledBtn");
                        }
                    }));

                    _connectResults.push(connect.connect(dom.byId('icoSearchAppName'), "click", function ()
                    {
                        dom.byId("hiddenBtn").focus();
                        doFilterAppName();
                    }));

                    // handle app name list click event
                    _connectResults.push(connect.connect(dom.byId("sdAppListContent"), 'click', function(e)
                    {
                        var itemNode = e.target;

                        if (domClass.contains(itemNode, 'appNameValue'))
                        {
                            itemNode = itemNode.parentNode;
                        }

                        if (!domClass.contains(itemNode, 'appNameItem'))
                        {
                            return;
                        }

                        var allItems = query('.appNameItem', dom.byId("sdAppList"));

                        for (var i=0;i<allItems.length;i++)
                        {
                            domClass.add(allItems[i], 'appNameItem-gray');
                        }

                        domClass.remove(itemNode, 'appNameItem-gray');

                        selectedAppName = itemNode.children[0].innerHTML;
                        dom.byId('btnAppNameDialogDone').disabled = false;
                        domClass.remove('btnAppNameDialogDone', "disabledBtn")
                    }));

                    _connectResults.push(connect.connect(dom.byId('btnAppNameDialogDone'), "click", function ()
                    {
                        if (domClass.contains('btnAppNameDialogDone', 'disabledBtn'))
                        {
                            return;
                        }

                        var appName = selectedAppName;

                        if (!appName)
                        {
                            if (dom.byId('txtSearchAppName').value.trim().length >0)
                            {
                                appName = dom.byId('txtSearchAppName').value.trim();
                                selectedAppName = appName;
                            }
                            else
                            {
                                annoUtil.showMessageDialog("Please select app in apps list or enter app in search text box.");
                                return;
                            }
                        }

                        hideAppNameDialog();

                        domStyle.set('searchAppNameContainer', 'display', '');
                        dom.byId('searchAppName').innerHTML = appName;

                        domStyle.set("listContainerStart", "height", (viewPoint.h-topBarHeight-searchSortsBarHeight-searchAppNameContainerHeight)+"px");
                        loadListData(true, null, searchOrder, true);
                    }));

                    _connectResults.push(connect.connect(dom.byId('closeSearchAppName'), "click", function ()
                    {
                        domStyle.set('searchAppNameContainer', 'display', 'none');
                        dom.byId('searchAppName').innerHTML = "";
                        selectedAppName = "";

                        domStyle.set("listContainerStart", "height", (viewPoint.h-topBarHeight-searchSortsBarHeight)+"px");
                        loadListData(true, null, searchOrder, true);
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

                document.removeEventListener("backbutton", exitApp, false);
                document.addEventListener("backbutton", exitApp, false);
            },
            beforeDeactivate: function()
            {
                var listContainer = dom.byId('listContainerStart');
                listScrollTop = listContainer.scrollTop;

                hideMenuDialog();
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