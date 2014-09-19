define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "dojo/window",
    "dijit/registry",
    "dojox/mvc/getStateful",
    "anno/common/Util",
    "anno/common/OAuthUtil"
],
    function (dom, domClass, domStyle, connect, lang, win, registry, getStateful, annoUtil, OAuthUtil)
    {
        var _connectResults = []; // events connect results
        var app = null;
        var eventsModel = null;
        var viewPoint, topBarHeight = 48;
        var loadingData = false,
            hasMoreSearchData = false,
            searchOffset = 0,
            limit = 30,
            searchTag = "";
        var dataStackLength = 0, dataStack = [];
        var communityId, appName;
        var searchByCommunity = false,
            searchByApp = false;

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
            created:"",
            comments:[{
                author:'',
                comment:''
            }]
        };

        var methodType = {
            LIST : "anno.anno.list",
            SEARCH : "anno.anno.search"
        };

        var adjustSize = function()
        {
            viewPoint = win.getBox();

            domStyle.set("listContainerSearch", "height", (viewPoint.h-topBarHeight)+"px");
        };

        var loadListData = function (poffset, clearData)
        {
            loadingData = true;
            annoUtil.showLoadingIndicator();

            var arg = {outcome: 'cursor,has_more,anno_list', limit: limit};
            var method;

            if (searchByCommunity) {
                arg.community = communityId;
                arg.query_type = "by_community";
                method = methodType.LIST;
            } else if (searchByApp) {
                arg.app = appName;
                arg.query_type = "by_app";
                method = methodType.LIST;
            } else {
                arg.order_type = "recent";
                arg.search_string = searchTag + " " + searchTag.substr(1);
                // arg.search_string = searchTag && (searchTag[0] == "#") ? encodeURIComponent(searchTag) : searchTag;
                arg["only_my_apps"] = false;
                method = methodType.SEARCH;
            }

            if (poffset) {
                if (method == methodType.LIST) {
                    arg.cursor = poffset;
                } else {
                    arg.offset = poffset;
                }
            }

            console.log("anno searching, args:" + JSON.stringify(arg));

            var APIConfig = {
                name: annoUtil.API.anno,
                method: method,
                parameter: arg,
                needAuth: true,
                success: function(data)
                {
                    var annoList = data.result.anno_list || [];

                    var spliceArgs = clearData ? [0, eventsModel.model.length] : [eventsModel.model.length, 0];
                    for (var i = 0, l = annoList.length; i < l; i++)
                    {
                        var eventData = lang.clone(emptyAnno);

                        eventData.annoText = annoList[i].anno_text;
                        eventData.annoType = annoList[i].anno_type;
                        eventData.annoIcon = annoList[i].anno_type == annoUtil.annoType.SimpleComment ? "icon-simplecomment" : "icon-shapes";
                        eventData.app = annoList[i].app_name;
                        eventData.author = annoList[i].creator ? annoList[i].creator.display_name || annoList[i].creator.user_email || annoList[i].creator.user_id : "";
                        eventData.id = annoList[i].id;
                        // eventData.circleX = parseInt(annoList[i].simple_x, 10);
                        // eventData.circleY = parseInt(annoList[i].simple_y, 10);
                        eventData.circleX = 0;
                        eventData.circleY = 0;
                        // eventData.simple_circle_on_top = annoList[i].simple_circle_on_top;
                        eventData.simple_circle_on_top = false;
                        eventData.created = annoUtil.getTimeAgoString(annoList[i].created);
                        eventData.app_icon_url = annoList[i].app_icon_url||"";

                        eventData.readStatusClass = "";
                        if ('anno_read_status' in annoList[i]) {
                            eventData.read_status = annoList[i].anno_read_status || false;
                            eventData.readStatusClass = (eventData.read_status == true) ? "read" : "unread";
                        }

                        if (eventData.app_icon_url)
                        {
                            eventData.annoIcon = "hidden";
                            eventData.appIconClass = "";
                        }
                        else
                        {
                            eventData.appIconClass = "hidden";
                        }

                        spliceArgs.push(new getStateful(eventData));
                    }

                    if (clearData)
                    {
                        dataStackLength++;
                        if (dataStackLength>1)
                        {
                            dataStack.push(eventsModel.model.splice.apply(eventsModel.model, spliceArgs));
                        }
                        else
                        {
                            eventsModel.model.splice.apply(eventsModel.model, spliceArgs);
                        }
                    }
                    else
                    {
                        eventsModel.model.splice.apply(eventsModel.model, spliceArgs);
                    }

                    loadingData = false;

                    if (method == methodType.LIST) {
                        searchOffset = data.result.cursor;
                    } else {
                        searchOffset = data.result.offset;
                    }

                    hasMoreSearchData = data.result.has_more;

                    domStyle.set('listContainerSearch', 'display', '');

                    if (clearData && annoList.length <= 0)
                    {
                        domStyle.set('noResultContainer_search', 'display', '');
                    }
                    else
                    {
                        domStyle.set('noResultContainer_search', 'display', 'none');
                    }
                },
                error: function()
                {
                    loadingData = false;
                    domStyle.set('noResultContainer_search', 'display', 'none');
                }
            };

            annoUtil.callGAEAPI(APIConfig);
        };

        var loadMoreData = function ()
        {
            if (loadingData) return;
            if (!hasMoreSearchData) return;

            loadListData(searchOffset, false);
        };

        var handleBackButton = function()
        {
            // app.setBackwardFired(true);
            history.back();
        };

        return {
            // simple view init
            init:function ()
            {
                eventsModel = this.loadedModels.searchAnno;
                app = this.app;
                adjustSize();

                // Analytics
                annoUtil.screenGATracking(annoUtil.analytics.category.search);

                _connectResults.push(connect.connect(dom.byId('listContainerSearch'), "scroll", this, function(){
                    var toEnd = false;
                    var listContainer = dom.byId('listContainerSearch');
                    if ((listContainer.clientHeight + listContainer.scrollTop) >= listContainer.scrollHeight) toEnd = true;

                    if (toEnd)
                    {
                        loadMoreData();
                    }
                }));
            },
            afterActivate: function()
            {
                // console.log(document.referrer);
                domStyle.set('noResultContainer_search', 'display', 'none');

                searchTag = this.params["tag"];
                dom.byId('headerTitleSearchAnno').innerHTML = searchTag;
                // dom.byId('headerTitleSearchAnno').innerHTML = decodeURIComponent(searchTag);

                communityId = this.params["communityId"];
                searchByCommunity = communityId ? true : false;

                appName = this.params["app"];
                searchByApp = appName ? true : false;

                // if user goes to this page by clicking backbutton, then just restore the previous data back
                // if not, then do the searching action
                if (app.isBackwardFired())
                {
                    if (dataStack.length)
                    {
                        var previousData = dataStack.pop();
                        dataStackLength--;

                        previousData.splice(0,0, 0, previousData.length);
                        eventsModel.model.splice.apply(eventsModel.model, [0,eventsModel.model.length]);
                        eventsModel.model.splice.apply(eventsModel.model, previousData);
                    }

                    domStyle.set('listContainerSearch', 'display', '');
                }
                else
                {
                    loadListData(null, true);
                }

                document.addEventListener("backbutton", handleBackButton, false);
            },
            beforeDeactivate: function()
            {
                document.removeEventListener("backbutton", handleBackButton, false);
                domStyle.set('listContainerSearch', 'display', 'none');
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