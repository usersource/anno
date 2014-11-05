define([
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/string",
    "dojo/_base/connect",
    "dojo/window",
    "dijit/registry",
    "dojox/mvc/getStateful",
    "anno/anno/AnnoDataHandler",
    "anno/common/Util",
    "anno/common/OAuthUtil"
],
    function (lang, dom, domClass, domConstruct, domGeom, domStyle, dojoString, connect, win, registry, getStateful, AnnoDataHandler, Util, OAuthUtil)
    {
        var _connectResults = []; // events connect results
        var app = null, eventsModel = null, needRefresh = true,
            lastOpenAnnoId = "";
        var offset = 0, limit = 15, hasMoreData = false;
        var listScrollTop = 0;
        var loadingData = false;
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

        var loadMyAnnos = function()
        {
            loadingData = true;
            var arg = { limit : limit };

            if (offset) {
                arg.cursor = offset;
            }

            AnnoDataHandler.loadLocalAnnos(function (localAnnos){
                console.log("getting my stuff from server.");
                var APIConfig = {
                    name: Util.API.anno,
                    method: "anno.anno.mystuff",
                    parameter: arg,
                    needAuth: true,
                    success: function(data)
                    {
                        var annoList = [];

                        if (data&&data.result)
                        {
                            annoList = data.result.anno_list||[];
                        }

                        var spliceArgs = [eventsModel.model.length, 0],
                            userInfo = Util.getCurrentUserInfo(),
                            userName = userInfo.nickname,
                            eventData;

                        for (var i= 0, l=localAnnos.length;i<l;i++)
                        {
                            eventData = lang.clone(emptyAnno);

                            eventData.annoText = localAnnos[i].comment;
                            eventData.annoType = localAnnos[i].anno_type;
                            eventData.annoIcon = localAnnos[i].anno_type == Util.annoType.SimpleComment?"icon-simplecomment":"icon-shapes";
                            eventData.app = localAnnos[i].app_name;
                            eventData.screenshot_key = localAnnos[i].screenshot_key;
                            eventData.author = userName;
                            eventData.id = localAnnos[i]._id;
                            eventData.circleX = parseInt(localAnnos[i].x, 10);
                            eventData.circleY = parseInt(localAnnos[i].y, 10);
                            // eventData.simple_circle_on_top = localAnnos[i].direction==0||localAnnos[i].direction=='false';
                            eventData.simple_circle_on_top = false;

                            eventData.deviceInfo = (localAnnos[i].model||'&nbsp;')+'&nbsp;'+(localAnnos[i].os_name||'&nbsp;')+(localAnnos[i].os_version||'&nbsp;');
                            eventData.vote = false;
                            eventData.flag = false;
                            eventData.level = localAnnos[i].level;
                            eventData.draw_elements = localAnnos[i].draw_elements||"";
                            eventData.comments = [];
                            eventData.created = eventData.when = Util.getTimeAgoString(parseInt(localAnnos[i].created));

                            eventData.lastActivityClass = "";
                            eventData.lastActivityText = "created";

                            eventData.app_icon_url = localAnnos[i].app_icon_url||"";
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

                        for (var i = 0, l = annoList.length; i < l; i++)
                        {
                            eventData = lang.clone(emptyAnno);

                            eventData.annoText = annoList[i].anno_text;
                            eventData.annoType = annoList[i].anno_type;
                            eventData.annoIcon = annoList[i].anno_type == Util.annoType.SimpleComment?"icon-simplecomment":"icon-shapes";
                            eventData.app = annoList[i].app_name;
                            eventData.author = annoList[i].creator ? annoList[i].creator.display_name || annoList[i].creator.user_email || annoList[i].creator.user_id : "";
                            eventData.author_image_url = annoList[i].creator ? annoList[i].creator.image_url : "";
                            eventData.userProfile = "";
                            eventData.userProfileClass = "hidden";
                            eventData.id = annoList[i].id;
                            // eventData.circleX = parseInt(annoList[i].simple_x, 10);
                            // eventData.circleY = parseInt(annoList[i].simple_y, 10);
                            eventData.circleX = 0;
                            eventData.circleY = 0;
                            // eventData.simple_circle_on_top = annoList[i].simple_circle_on_top;
                            eventData.simple_circle_on_top = false;
                            eventData.created = Util.getTimeAgoString(annoList[i].created);
                            eventData.app_icon_url = annoList[i].app_icon_url||"";

                            eventData.last_activity_user = annoList[i].last_activity_user ? annoList[i].last_activity_user.display_name ||
                                                                                            annoList[i].last_activity_user.user_email ||
                                                                                            annoList[i].last_activity_user.user_id : "";
                            eventData.last_activity_user_image_url = annoList[i].last_activity_user ? annoList[i].last_activity_user.image_url : "";

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

                            if (eventData.author_image_url) {
                                eventData.userProfile = "hidden";
                                eventData.userProfileClass = "";
                            }

                            handleAnnoActivityInfo(eventData, annoList[i]);
                            spliceArgs.push(new getStateful(eventData));
                        }

                        eventsModel.model.splice.apply(eventsModel.model, spliceArgs);
                        Util.hideLoadingIndicator();

                        loadingData = false;
                        offset = data.result.cursor;
                        hasMoreData = data.result.has_more;

                        drawAnnos(spliceArgs);
                    },
                    error: function() {
                        loadingData = false;
                    }
                };

                Util.callGAEAPI(APIConfig);
            });
        };

        var handleAnnoActivityInfo = function(anno, annoData) {
            var lastActivity = annoData.last_activity;

            if (lastActivity == "UserSource" || lastActivity == "create") {
                anno.lastActivityClass = "icon-plus";
                anno.lastActivityText = "created";
            } else if (lastActivity == "vote") {
                anno.lastActivityClass = "icon-thumbs-up";
                anno.lastActivityText = "upvoted";
            } else if (lastActivity == "flag") {
                anno.lastActivityClass = "icon-flag";
                anno.lastActivityText = "flagged";
            } else if (lastActivity == "follwup") {
                anno.lastActivityClass = "icon-comment";
                anno.lastActivityText = "commented";
            } else if (lastActivity == "anno") {
                anno.lastActivityClass = "icon-pencil";
                anno.lastActivityText = "edited";
            }

            anno.when = Util.getTimeAgoString(annoData.last_update_time);
        };

        var drawAnnos = function(annos)
        {
            if (annos.length <= 2)
            {
                domStyle.set('listContainerMyStuff', 'display', 'none');
                domStyle.set('learnHowContainer', 'display', '');
            }
            else
            {
                domStyle.set('listContainerMyStuff', 'display', '');
                domStyle.set('learnHowContainer', 'display', 'none');
            }
        };

        var adjustSize = function()
        {
            var viewPoint = win.getBox();
            var parentBox = domGeom.getMarginBox("headingMyStuff");

            domStyle.set("listContainerMyStuff", "height", (viewPoint.h-parentBox.h)+"px");
        };

        var goBack = function()
        {
            needRefresh = true;
            history.back();
        };

        var annoMyStuffRead = window.annoMyStuffRead = function() {
            needRefresh = false;
            lastOpenAnnoId = this._index;
            if (domClass.contains(this.domNode, "unread")) {
                domClass.replace(this.domNode, "read", "unread");
            }
        };

        var loadMoreData = function() {
            if (loadingData || !hasMoreData) return;
            loadMyAnnos();
        };

        return {
            // simple view init
            init:function ()
            {
                app = this.app;
                eventsModel = this.loadedModels.mystuff;
                app.refreshMyActivites = loadMyAnnos;
                loadMyAnnos();

                _connectResults.push(connect.connect(dom.byId("btnLearnHow"), 'click', function(e)
                {
                    Util.startActivity("Intro", false);
                }));

                _connectResults.push(connect.connect(dom.byId("iconBackMyStuff"), 'click', function(e) {
                    dojo.stopEvent(e);
                    goBack();
                }));

                _connectResults.push(connect.connect(dom.byId("navBtnBackMyStuff"), 'click', function(e) {
                    dojo.stopEvent(e);
                    goBack();
                }));

                _connectResults.push(connect.connect(dom.byId("divBtnBackMyStuffPlugin"), "click", function(e) {
                    dojo.stopEvent(e);
                    goBack();
                }));

                _connectResults.push(connect.connect(dom.byId("listContainerMyStuff"), "scroll", this, function() {
                    var listContainer = dom.byId("listContainerMyStuff");
                    if ((listContainer.clientHeight + listContainer.scrollTop) >= listContainer.scrollHeight) {
                        loadMoreData();
                    }
                }));
            },
            afterActivate: function()
            {
                // Analytics
                Util.screenGATracking(Util.analytics.category.my_activity);
                
                adjustSize();

                if (!needRefresh)
                {
                    // update opened anno activity info
                    var activityIndicator = dom.byId("annoActIndicator_"+lastOpenAnnoId);

                    var currentAnno = eventsModel.cursor;
                    if (activityIndicator&&currentAnno.lastActivityChangedClass)
                    {
                        domClass.remove(activityIndicator);
                        domClass.add(activityIndicator, "annoOrangeColor");
                        domClass.add(activityIndicator, currentAnno.lastActivityChangedClass);

                        dom.byId("annoActText_"+lastOpenAnnoId).innerHTML = currentAnno.lastActivityText;
                        dom.byId("annoActWhen_"+lastOpenAnnoId).innerHTML = Util.getTimeAgoString(new Date().getTime(), new Date(currentAnno.when));

                        currentAnno.lastActivityChangedClass = "";
                    }
                }

                var listContainer = dom.byId('listContainerMyStuff');
                listContainer.scrollTop = listScrollTop;

                document.removeEventListener("backbutton", goBack, false);
                document.addEventListener("backbutton", goBack, false);
            },
            beforeDeactivate: function()
            {
                var listContainer = dom.byId('listContainerMyStuff');
                listScrollTop = listContainer.scrollTop;
                document.removeEventListener("backbutton", goBack, false);
            },
            destroy:function ()
            {
                var connectResult = _connectResults.pop();
                while (connectResult)
                {
                    connect.disconnect(connectResult);
                    connectResult = _connectResults.pop();
                }

                document.removeEventListener("backbutton", goBack, false);
            }
        }
    });