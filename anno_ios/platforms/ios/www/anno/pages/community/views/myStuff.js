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
    "anno/common/OAuthUtil",
    "dojo/text!../templates/localAnnoItem.html"
],
    function (lang, dom, domClass, domConstruct, domGeom, domStyle, dojoString, connect, win, registry, getStateful, AnnoDataHandler, Util, OAuthUtil, annoItemTemplate)
    {
        var _connectResults = []; // events connect results
        var app = null, eventsModel = null, needRefresh = true;
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
            AnnoDataHandler.loadLocalAnnos(function (localAnnos){
                Util.showLoadingIndicator();
                OAuthUtil.getAccessToken(function(){
                    Util.loadAPI(Util.API.anno, function(){
                        var mystuff = gapi.client.anno.anno.mystuff();
                        console.error("getting my annos from server.");
                        mystuff.execute(function (data)
                        {
                            if (!data)
                            {
                                Util.hideLoadingIndicator();
                                alert("Items returned from server are empty.");
                            }

                            if (data.error)
                            {
                                Util.hideLoadingIndicator();
                                alert("An error occurred when calling anno.mystuff api: "+data.error.message);
                            }

                            var annoList = [];

                            if (data&&data.result)
                            {
                                annoList = data.result.anno_list||[];
                            }

                            var spliceArgs = [0, eventsModel.model.length], eventData, userInfo = Util.getCurrentUserInfo(), userName = userInfo.nickname;

                            for (var i= 0, l=localAnnos.length;i<l;i++)
                            {
                                eventData = lang.clone(emptyAnno);

                                eventData.annoText = localAnnos[i].comment;
                                eventData.annoType = localAnnos[i].anno_type;
                                eventData.annoIcon = localAnnos[i].anno_type == Util.annoType.SimpleComment?"icon-simplecomment":"icon-shapes";
                                eventData.app = localAnnos[i].app_name;
                                eventData.screenshot_key = localAnnos[i].screenshot_key;
                                eventData.author = userName;
                                eventData.id = null;
                                eventData.circleX = parseInt(localAnnos[i].x, 10);
                                eventData.circleY = parseInt(localAnnos[i].y, 10);
                                eventData.simple_circle_on_top = localAnnos[i].direction==0||localAnnos[i].direction=='false';

                                eventData.deviceInfo = (localAnnos[i].model||'&nbsp;')+'&nbsp;'+(localAnnos[i].os_name||'&nbsp;')+(localAnnos[i].os_version||'&nbsp;');
                                eventData.vote = false;
                                eventData.flag = false;
                                eventData.level = localAnnos[i].level;
                                eventData.draw_elements = localAnnos[i].draw_elements||"";
                                eventData.comments = [];
                                eventData.created = Util.getTimeAgoString(localAnnos[i].created);

                                spliceArgs.push(new getStateful(eventData));
                            }

                            for (var i = 0, l = annoList.length; i < l; i++)
                            {
                                eventData = lang.clone(emptyAnno);

                                eventData.annoText = annoList[i].anno_text;
                                eventData.annoType = annoList[i].anno_type;
                                eventData.annoIcon = annoList[i].anno_type == Util.annoType.SimpleComment?"icon-simplecomment":"icon-shapes";
                                eventData.app = annoList[i].app_name;
                                eventData.author = annoList[i].creator?annoList[i].creator.display_name||annoList[i].creator.user_email||annoList[i].creator.user_id:"";
                                eventData.id = annoList[i].id;
                                eventData.circleX = parseInt(annoList[i].simple_x, 10);
                                eventData.circleY = parseInt(annoList[i].simple_y, 10);
                                eventData.simple_circle_on_top = annoList[i].simple_circle_on_top;
                                eventData.created = Util.getTimeAgoString(annoList[i].created);

                                spliceArgs.push(new getStateful(eventData));
                            }

                            eventsModel.model.splice.apply(eventsModel.model, spliceArgs);

                            console.error(JSON.stringify(data.result));
                            Util.hideLoadingIndicator();

                            drawAnnos(spliceArgs);
                        });
                    });
                });
            });
        };

        var drawAnnos = function(annos)
        {
            var annoItemList = registry.byId('annoListMyStuff');
            annoItemList.destroyDescendants();

            for (var i= 2,c=annos.length;i<c;i++)
            {
                if (!annos[i].annoIcon)
                    annos[i].annoIcon = annos[i].anno_type == Util.annoType.DrawComment?"icon-shapes":"icon-simplecomment";
                domConstruct.create("li", {
                    "transition":'slide',
                    "data-dojo-type":"dojox/mobile/ListItem",
                    "data-dojo-props":"variableHeight:true,clickable:true,noArrow:true,_index:"+(i-2),
                    innerHTML: dojoString.substitute(annoItemTemplate, annos[i])
                }, annoItemList.domNode, "last");
            }

            Util.getParser().parse(annoItemList.domNode);

            var items = annoItemList.getChildren();

            for (var i= 0,c=items.length;i<c;i++)
            {
                items[i].annoItem = annos[i];
                items[i].on("click", function(){
                    gotoLocalAnnoViewer(this,this.annoItem);
                });
            }

            if (annos.length <=0)
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

        var gotoLocalAnnoViewer = function(annoItem)
        {
            app.transitionToView(annoItem.domNode, {target:'detail',url:'#detail', params:{cursor:annoItem._index, source:"mystuff"}});
            needRefresh = false;
        };

        var goBack = function()
        {
            needRefresh = true;
            history.back();
        };

        return {
            // simple view init
            init:function ()
            {
                app = this.app;
                eventsModel = this.loadedModels.mystuff;

                _connectResults.push(connect.connect(dom.byId("btnLearnHow"), 'click', function(e)
                {
                    Util.startActivity("Intro", true);
                }));

                _connectResults.push(connect.connect(dom.byId("iconBackMyStuff"), 'click', function(e)
                {
                    goBack();
                }));

                _connectResults.push(connect.connect(dom.byId("navBtnBackMyStuff"), 'click', function(e)
                {
                    goBack();
                }));
            },
            afterActivate: function()
            {
                adjustSize();

                if (needRefresh)
                {
                    loadMyAnnos();
                }

                document.removeEventListener("backbutton", goBack, false);
                document.addEventListener("backbutton", goBack, false);
            },
            beforeDeactivate: function()
            {
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