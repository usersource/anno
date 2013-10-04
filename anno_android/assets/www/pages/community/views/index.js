define([
    "dojo/_base/array",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/query",
    "dojo/_base/lang",
    "dojo/_base/connect",
    "dojo/window",
    "dojo/has",
    "dojo/sniff",
    "dijit/registry",
    "dojox/mvc/at",
    "dojo/store/Memory",
    "dojox/mvc/getStateful"
],
    function (arrayUtil, dom, domClass, domGeom, domStyle, query, lang, connect, win, has, sniff, registry, at, Memory, getStateful)
    {
        var _connectResults = []; // events connect results
        var eventsModel = null;
        var app = null;
        var listScrollTop = 0;
        var loadingIndicator = null;
        var loadingMoreData = false,
            offset = 0, limit=30;
        var emptyAnno = {
            "id": 0,
            "annoText": "0",
            "app": "0",
            "author": "0",
            "screenshot":"0",
            circleX: 0,
            circleY:0,
            deviceInfo:" ",
            comments:[{
                author:'',
                comment:''
            }]
        };

        var loadListData = function (poffset)
        {
            if (poffset)
            {
                loadingMoreData = true;
            }
            showLoadingIndicator();
            cordova.exec(
                function (data)
                {
                    if (!data&&!data.annos)
                    {
                        hideLoadingIndicator();
                        loadingMoreData = false;
                        alert("Annos returned from server are empty.");
                        return;
                    }
                    var annoList = data.annos;

                    var spliceArgs = [eventsModel.model.length, 0];
                    for (var i = 0, l = annoList.length; i < l; i++)
                    {
                        var eventData = lang.clone(emptyAnno);

                        eventData.annoText = annoList[i].annoText;
                        eventData.app = annoList[i].app;
                        eventData.author = annoList[i].author;
                        eventData.id = annoList[i].id;

                        spliceArgs.push(new getStateful(eventData));
                    }

                    eventsModel.model.splice.apply(eventsModel.model, spliceArgs);

                    hideLoadingIndicator();
                    loadingMoreData = false;

                    if (poffset)
                    {
                        offset = poffset;
                    }

                },
                function (err)
                {
                    hideLoadingIndicator();
                    loadingMoreData = false;
                    alert(err);
                },
                "CordovaHttpService",
                "get_anno_list",
                [{offset: eventsModel.model.length||0, limit: limit}]

            );
        };

        var loadMoreData = function()
        {
            if (loadingMoreData) return;

            loadListData(offset+limit);

            adjustSize();
        };

        var adjustSize = function()
        {
            var viewPoint = win.getBox();
            var parentBox = domGeom.getMarginBox("headingStart");

            domStyle.set("listContainerStart", "height", (viewPoint.h-parentBox.h)+"px");
        };

        var showLoadingIndicator = function()
        {
            var cl = loadingIndicator;

            if (!cl)
            {
                cl = loadingIndicator = new CanvasLoader('', {
                    id: "index_loading"
                });
                cl.setColor('#302730');
                cl.setDiameter(50);
                cl.setRange(0.9);
            }

            var viewPoint = win.getBox();
            domStyle.set("index_loading", {
                position: 'absolute',
                left: ((viewPoint.w-50)/2) + 'px',
                top: ((viewPoint.h-50)/2) + 'px',
                zIndex:4000
            });

            cl.show();
        };
        var hideLoadingIndicator = function()
        {
            if (loadingIndicator)
            {
                loadingIndicator.hide();
            }
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
                "CordovaHttpService",
                'exit_community',
                []
            );
        };

        return {
            // simple view init
            init:function ()
            {
                console.log("console from view", this);
                eventsModel = this.loadedModels.events;
                app = this.app;

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

                window.setTimeout(function(){
                    loadListData();
                }, 50);
            },
            afterActivate: function()
            {
                adjustSize();
                var listContainer = dom.byId('listContainerStart');
                listContainer.scrollTop = listScrollTop;
            },
            beforeDeactivate: function()
            {
                var listContainer = dom.byId('listContainerStart');
                listScrollTop = listContainer.scrollTop;
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