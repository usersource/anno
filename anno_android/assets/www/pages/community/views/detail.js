define([
    "dojo/_base/array",
    "dojo/_base/fx",
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
    "dojox/css3/transit",
    "dojo/store/Memory",
    "dojox/mvc/getStateful"
],
    function (arrayUtil, baseFX, dom, domClass, domGeom, domStyle, query, lang, connect, win, has, sniff, registry, transit, Memory, getStateful)
    {
        var _connectResults = [];
        var eventsModel = null;
        var currentIndex = 0;
        var textDataAreaShown = false;
        var loadingIndicator = null;
        var app = null;
        var savingVote = false, savingFlag = false, screenshotMargin = 8;
        var currentAuthor = 'me';
        var annoTooltipY;

        var adjustSize = function()
        {
            var viewPoint = win.getBox();
            var parentBox = domGeom.getMarginBox("headingDetail");
            domStyle.set("imgDetailScreenshot", "width", (viewPoint.w-screenshotMargin)+"px");

            var h = (viewPoint.h-parentBox.h-6);
            domStyle.set("textDataAreaContainer", "width", (viewPoint.w-30-6-10)+"px");
            domStyle.set("annoTextDetail", "width", (viewPoint.w-30-6-10-8)+"px");
            domStyle.set("textDataAreaContainer", "height", (h-11)+"px");
            domStyle.set("annoCommentsContainer", "height", (h-76)+"px");//104

            domStyle.set("appNameTextBox", "width", (viewPoint.w-30-6-10-40)+"px");

            domStyle.set("screenshotTooltipDetail", "width", (viewPoint.w-screenshotMargin-viewPoint.w*0.10)+"px");


            //var tooltipWidget = registry.byId('textTooltip');
            //domStyle.set(tooltipWidget.domNode, 'top', (parseInt(domStyle.get(tooltipWidget.domNode, 'top'))+14)+'px');
            //domStyle.set("screenshotContainerDetail", "height", (viewPoint.h-parentBox.h)+"px");
        };

        var screenshotImageOnload = function()
        {
            annoTooltipY = null;
            window.setTimeout(function(){
                //console.error(eventsModel.cursor.circleX+","+eventsModel.cursor.circleY);
                var viewPoint = win.getBox();
                //console.error(viewPoint.h);
                var tooltipWidget = registry.byId('textTooltip');
                var parentBox = domGeom.getMarginBox("headingDetail");

                var orignialRatio = dom.byId('imgDetailScreenshot').naturalHeight/dom.byId('imgDetailScreenshot').naturalWidth;
                dom.byId("imgDetailScreenshot").width = (viewPoint.w-screenshotMargin);
                dom.byId("imgDetailScreenshot").height = (viewPoint.w-screenshotMargin)*orignialRatio;
                //console.error("scna "+ dom.byId("imgDetailScreenshot").naturalWidth+","+dom.byId("imgDetailScreenshot").naturalHeight);
                //console.error("sc "+ dom.byId("imgDetailScreenshot").width+","+dom.byId("imgDetailScreenshot").height);

                domStyle.set("lightCoverScreenshot", "width", (30)+"px");

                if ((viewPoint.w-screenshotMargin)*orignialRatio< viewPoint.h)
                {
                    domStyle.set("lightCoverScreenshot", "height", (viewPoint.h+400)+"px");
                }
                else
                {
                    domStyle.set("lightCoverScreenshot", "height", ((viewPoint.w-screenshotMargin)*orignialRatio+400)+"px");
                }

                var toolTipDivWidth = (viewPoint.w-screenshotMargin-viewPoint.w*0.10);
                domStyle.set("screenshotTooltipDetail", "width", toolTipDivWidth+"px");

                if (eventsModel.cursor.circleX != null)
                {
                    var imageRatio = (viewPoint.w-screenshotMargin)/dom.byId('imgDetailScreenshot').naturalWidth;
                    var imageRatioV = ((viewPoint.w-screenshotMargin)*orignialRatio)/dom.byId('imgDetailScreenshot').naturalHeight;
                    domStyle.set("screenshotAnchorDetail", {
                        top: eventsModel.cursor.circleY*imageRatioV+'px',
                        left: eventsModel.cursor.circleX*imageRatio+'px',
                        display: ''
                    });

                    //console.error("sca "+ eventsModel.cursor.circleX*imageRatio+","+eventsModel.cursor.circleY*imageRatioV);

                    domStyle.set("screenshotAnchorInvisibleDetail", {
                        top: eventsModel.cursor.circleY*imageRatioV+'px'
                    });

                    if (eventsModel.cursor.circleY > domStyle.get("screenshotTooltipDetail", "height"))
                    {
                        tooltipWidget.show(dom.byId('screenshotAnchorInvisibleDetail'), ['above-centered','below-centered','before','after']);
                        annoTooltipY = parseInt(domStyle.get(tooltipWidget.domNode, 'top'))+14;
                        domStyle.set(tooltipWidget.domNode, 'top', annoTooltipY+'px');
                    }
                    else
                    {
                        tooltipWidget.show(dom.byId('screenshotAnchorInvisibleDetail'), ['below-centered','below-centered','after','before']);
                        annoTooltipY = parseInt(domStyle.get(tooltipWidget.domNode, 'top'))-14;
                        domStyle.set(tooltipWidget.domNode, 'top', annoTooltipY+'px');
                    }

                    var pos = domGeom.position("screenshotAnchorDetail", true);
                    var tpLeft = domStyle.get(tooltipWidget.domNode, 'left');
                    domStyle.set(tooltipWidget.anchor, {
                        left: (pos.x-tpLeft+2)+'px'
                    });

                    if (textDataAreaShown)
                    {
                        tooltipWidget.hide();
                    }
                }
                else
                {
                    domStyle.set("screenshotAnchorDetail", "display", "none");
                    tooltipWidget.show(dom.byId('screenshotDefaultAnchorDetail'), ['below-centered','below-centered','after','before']);
                    annoTooltipY = parseInt(domStyle.get(tooltipWidget.domNode, 'top'))-14;
                    domStyle.set(tooltipWidget.domNode, 'top', annoTooltipY+'px');

                    if (textDataAreaShown)
                    {
                        tooltipWidget.hide();
                    }
                }

                showToastMsg('tap for details');
            }, 500);
        };

        var setDetailsContext = function (index)
        {
            // only set the cursor if it is different and valid
            var idx = parseInt(index);
            if (idx < eventsModel.model.length)
            {
                eventsModel.set("cursorIndex", idx);
                currentIndex = idx;

                domClass.remove('imgFlag', 'icoImgActive');
                domClass.remove('imgThumbsUp', 'icoImgActive');

                if (idx == 0)
                {
                    domClass.remove("navBtnNext", "navBtnDisabled");
                    domClass.add("navBtnPrevious", "navBtnDisabled");
                }
                else if (idx == (eventsModel.model.length-1))
                {
                    domClass.add("navBtnNext", "navBtnDisabled");
                    domClass.remove("navBtnPrevious", "navBtnDisabled");
                }
                else
                {
                    domClass.remove("navBtnNext", "navBtnDisabled");
                    domClass.remove("navBtnPrevious", "navBtnDisabled");
                }

                var tooltipWidget = registry.byId('textTooltip');
                var viewPoint = win.getBox();

                var toolTipDivWidth = (viewPoint.w-30-viewPoint.w*0.10),
                    pxPerChar = 8,
                    charsPerLine = toolTipDivWidth/pxPerChar;

                if (eventsModel.cursor.annoText.length >= charsPerLine*3)
                {
                    var shortText = eventsModel.cursor.annoText.substr(0, charsPerLine*3-3)+"...";

                    dom.byId('screenshotTooltipDetail').innerHTML = shortText;
                }

                dom.byId("imgDetailScreenshot").width = (viewPoint.w-30);
                domStyle.set("screenshotTooltipDetail", "width", toolTipDivWidth+"px");


                if (eventsModel.cursor.app == null||eventsModel.cursor.app == '')
                {
                    domStyle.set('editAppNameImg', 'display', '');
                    dom.byId('appNameSpanDetail').innerHTML = "unknown";
                }
                else
                {
                    domStyle.set('editAppNameImg', 'display', 'none');
                }

                console.error("vote: "+ eventsModel.cursor.vote+", flat: "+eventsModel.cursor.flag);

                if (eventsModel.cursor.vote == "true")
                {
                    if (!domClass.contains('imgThumbsUp','icoImgActive'))
                    {
                        domClass.add('imgThumbsUp', 'icoImgActive');
                    }
                }
                else
                {
                    domClass.remove('imgThumbsUp', 'icoImgActive');
                }

                if (eventsModel.cursor.flag == "true")
                {
                    if (!domClass.contains('imgFlag','icoImgActive'))
                    {
                        domClass.add('imgFlag', 'icoImgActive');
                    }
                }
                else
                {
                    domClass.remove('imgFlag', 'icoImgActive');
                }

                adjustAnnoCommentSize();
            }
        };

        var adjustAnnoCommentSize = function()
        {
            var annoContainer = dom.byId('annoCommentsContainer');
            var parentBox = domGeom.getMarginBox("headingDetail");
            var viewPoint = win.getBox();
            var h = (viewPoint.h-parentBox.h-6);

            domStyle.set("annoCommentsContainer", "height", (h-76)+"px")
            if (annoContainer.scrollHeight > annoContainer.clientHeight)
            {
                domStyle.set("annoCommentsContainer", "height", (h-76)+"px");
            }
            else
            {
                domStyle.set("annoCommentsContainer", "height", 'auto');
            }

            var ach = domGeom.getMarginBox("annoCommentsSet");
            if ((ach.h +parentBox.h+30) > (viewPoint.h-400))
            {
                domStyle.set("lightCoverScreenshot", "height", (ach.h +parentBox.h+30+400)+"px");
            }
        };

        var goNextRecord = function()
        {
            if ( (currentIndex+1)< eventsModel.model.length)
            {
                window.setTimeout(function(){
                    loadDetailData(currentIndex+1);
                }, 50);
            }
        };

        var goPreviousRecord = function()
        {
            if ( (currentIndex-1)>=0)
            {
                window.setTimeout(function(){
                    loadDetailData(currentIndex-1);
                }, 50);
            }
        };

        var showTextData = function()
        {
            domStyle.set("imgDetailScreenshot", "opacity", '0.4');
            transit(null, dom.byId('textDataAreaContainer'), {
                transition:"slide",
                duration:600
            });
            registry.byId('textTooltip').hide();
            window.setTimeout(function(){
                domStyle.set("lightCoverScreenshot", "display", '');
            },400);

            textDataAreaShown = true;
            adjustAnnoCommentSize();
        };

        var hideTextData = function()
        {
            domStyle.set("lightCoverScreenshot", "display", 'none');
            domStyle.set("imgDetailScreenshot", "opacity", '1');
            transit(dom.byId('textDataAreaContainer'), null, {
                transition:"slide",
                duration:600,
                reverse:true
            });

            domClass.replace(registry.byId('textTooltip').domNode, "mblTooltipVisible" ,"mblTooltipHidden");

            textDataAreaShown = false;
        };

        var drawOrangeCircle = function()
        {
            var ctx = dom.byId('screenshotAnchorDetail').getContext('2d');
            var canvasWidth = 32;

            ctx.beginPath();
            ctx.strokeStyle = "#FFA500";
            ctx.lineWidth = 3;
            ctx.arc(20, 20, canvasWidth/2, 0, 2 * Math.PI, true);
            ctx.stroke();
            ctx.fillStyle = "rgba(255,165,0, 0.4)";
            ctx.arc(20, 20, canvasWidth/2-3, 0, 2 * Math.PI, true);
            ctx.fill();
        };

        var showAppNameTextBox = function()
        {
            domStyle.set('editAppNameImg', 'display', 'none');

            var pos = domGeom.position('appNameSpanDetail', true);

            domStyle.set('appNameSpanDetail', 'display', 'none');
            domStyle.set('appNameTextBox', {display: '', top:pos.y+'px', left:pos.x+'px'});
            domStyle.set('lightCover', 'display', '');

            window.setTimeout(function(){
                dom.byId('appNameTextBox').click();
                dom.byId('appNameTextBox').focus();
            },300);
            dom.byId('hiddenBtn').focus();

            dom.byId('appNameTextBox').value = dom.byId('appNameSpanDetail').innerHTML == 'unknown'?'':dom.byId('appNameSpanDetail').innerHTML;
        };

        var saveAppName = function()
        {
            var newAppName = dom.byId('appNameTextBox').value.trim();
            var id = eventsModel.cursor.id;

            if (newAppName.length <=0)
            {
                dom.byId('hiddenBtn').focus();

                domStyle.set('appNameSpanDetail', 'display', '');
                domStyle.set('appNameTextBox', {display: 'none'});
                domStyle.set('lightCover', 'display', 'none');
                domStyle.set('editAppNameImg', 'display', '');
            }

            showLoadingIndicator();
            cordova.exec(
                function (data)
                {
                    if (!data)
                    {
                        hideLoadingIndicator();

                        dom.byId('hiddenBtn').focus();

                        domStyle.set('appNameSpanDetail', 'display', '');
                        domStyle.set('appNameTextBox', {display: 'none'});
                        domStyle.set('lightCover', 'display', 'none');
                        domStyle.set('editAppNameImg', 'display', '');

                        alert("Update app name returned from server is empty.");
                        return;
                    }

                    if (data.success != "true")
                    {
                        hideLoadingIndicator();

                        dom.byId('hiddenBtn').focus();

                        domStyle.set('appNameSpanDetail', 'display', '');
                        domStyle.set('appNameTextBox', {display: 'none'});
                        domStyle.set('lightCover', 'display', 'none');
                        domStyle.set('editAppNameImg', 'display', '');

                        alert(data.message);
                        return;
                    }


                    var currentAnno = eventsModel.cursor;
                    currentAnno.set('app', newAppName);

                    hideLoadingIndicator();
                    dom.byId('hiddenBtn').focus();

                    domStyle.set('appNameSpanDetail', 'display', '');
                    domStyle.set('appNameTextBox', {display: 'none'});
                    domStyle.set('lightCover', 'display', 'none');
                    domStyle.set('editAppNameImg', 'display', '');

                },
                function (err)
                {
                    hideLoadingIndicator();

                    dom.byId('hiddenBtn').focus();

                    domStyle.set('appNameSpanDetail', 'display', '');
                    domStyle.set('appNameTextBox', {display: 'none'});
                    domStyle.set('lightCover', 'display', 'none');
                    domStyle.set('editAppNameImg', 'display', '');

                    alert(err);
                },
                "CordovaHttpService",
                "update_app_name",
                [{anno_id: id, "app_name": newAppName}]

            );
        };

        var showToastMsg = function(msg)
        {
            var vp = win.getBox(), msgContainer = dom.byId('toastMsgContainer');

            msgContainer.innerHTML = msg;
            domStyle.set(msgContainer, {
                top: (vp.h-20)/2+'px',
                left: (vp.w-230)/2+'px',
                display:''
            });

            window.setTimeout(function(){
                domStyle.set(msgContainer, {
                    display:'none'
                });
            }, 3000);

            /*baseFX.fadeIn({
                node: msgContainer,
                start:0,
                duration:750,
                onEnd:function()
                {
                    window.setTimeout(function(){
                        alert(baseFX+"3");
                        baseFX.fadeOut({
                            node: dom.byId('toastMsgContainer'),
                            start:1,
                            duration:750
                        }).play();
                    }, 3000);
                }
            }).play();*/
        };

        var showLoadingIndicator = function()
        {
            var cl = loadingIndicator;

            if (!cl)
            {
                cl = loadingIndicator = new CanvasLoader('', {
                    id: "detail_loading"
                });
                cl.setColor('#302730');
                cl.setDiameter(50);
                cl.setRange(0.9);
            }

            var viewPoint = win.getBox();
            domStyle.set("detail_loading", {
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

        var loadDetailData = function(cursor)
        {
            eventsModel.set("cursorIndex", cursor);
            var id;
            if (!eventsModel.cursor)
            {
                id = eventsModel.model[0].id;
            }
            else
            {
                id = eventsModel.cursor.id;
            }

            showLoadingIndicator();
            cordova.exec(
                function (data)
                {
                    if (!data&&!data.anno)
                    {
                        hideLoadingIndicator();
                        alert("Anno detail returned from server is empty.");
                        return;
                    }

                    if (data.success != "true")
                    {
                        hideLoadingIndicator();
                        alert(data.message);
                        return;
                    }

                    var currentAnno = eventsModel.cursor||eventsModel.model[0], returnAnno = data.anno, deviceInfo = '';

                    currentAnno.set('circleX', parseInt(returnAnno.circleX, 10));
                    currentAnno.set('circleY', parseInt(returnAnno.circleY, 10));
                    currentAnno.set('screenshot', "data:image/png;base64,"+returnAnno.screenshot);

                    currentAnno.set('comments',new getStateful(returnAnno.comments));

                    deviceInfo = (returnAnno.deviceModel||'&nbsp;')+'&nbsp;'+(returnAnno.OSVersion||'&nbsp;');
                    currentAnno.set('deviceInfo', deviceInfo);

                    currentAnno.set('vote', returnAnno.vote);
                    currentAnno.set('flag', returnAnno.flag);

                    hideLoadingIndicator();
                    setDetailsContext(cursor);

                },
                function (err)
                {
                    hideLoadingIndicator();
                    alert(err);
                },
                "CordovaHttpService",
                "get_anno_detail",
                [{anno_id: id}]

            );
        };

        var saveComment = function(comment)
        {
            var author = currentAuthor;
            var id;
            if (!eventsModel.cursor)
            {
                id = eventsModel.model[0].id;
            }
            else
            {
                id = eventsModel.cursor.id;
            }

            showLoadingIndicator();
            cordova.exec(
                function (data)
                {
                    if (!data)
                    {
                        hideLoadingIndicator();
                        alert("Add followup returned from server is empty.");
                        return;
                    }

                    if (data.success != "true")
                    {
                        hideLoadingIndicator();
                        alert(data.message);
                        return;
                    }

                    console.error(window.JSON.stringify(data));
                    var currentAnno = eventsModel.cursor||eventsModel.model[0];

                    hideLoadingIndicator();
                    currentAnno.comments.splice(0,0,new getStateful({author:author, comment:comment}));
                    adjustAnnoCommentSize();
                },
                function (err)
                {
                    hideLoadingIndicator();
                    alert(err);
                },
                "CordovaHttpService",
                "add_follow_up",
                [{anno_id: id, comment:comment}]

            );
        };

        var saveVote = function(action)
        {
            if (savingVote) return;
            savingVote = true;
            var id;
            if (!eventsModel.cursor)
            {
                id = eventsModel.model[0].id;
            }
            else
            {
                id = eventsModel.cursor.id;
            }

            showLoadingIndicator();
            cordova.exec(
                function (data)
                {
                    if (!data)
                    {
                        hideLoadingIndicator();
                        alert("Data returned from server is empty.");
                        savingVote = false;
                        return;
                    }

                    if (data.success != "true")
                    {
                        hideLoadingIndicator();
                        alert(data.message);
                        savingVote = false;
                        return;
                    }

                    if (action == "remove_vote")
                    {
                        domClass.remove('imgThumbsUp', 'icoImgActive');
                    }
                    else
                    {
                        domClass.add('imgThumbsUp', 'icoImgActive');
                    }
                    hideLoadingIndicator();
                    savingVote = false;
                },
                function (err)
                {
                    hideLoadingIndicator();
                    alert(err);
                    savingVote = false;
                },
                "CordovaHttpService",
                action,
                [{anno_id: id}]

            );
        };

        var saveFlag = function(action)
        {
            if (savingFlag) return;
            savingFlag = true;
            var id;
            if (!eventsModel.cursor)
            {
                id = eventsModel.model[0].id;
            }
            else
            {
                id = eventsModel.cursor.id;
            }

            showLoadingIndicator();
            cordova.exec(
                function (data)
                {
                    if (!data)
                    {
                        hideLoadingIndicator();
                        alert("Data returned from server is empty.");
                        savingFlag = false;
                        return;
                    }

                    if (data.success != "true")
                    {
                        hideLoadingIndicator();
                        alert(data.message);
                        savingFlag = false;
                        return;
                    }

                    if (action == "remove_flag")
                    {
                        domClass.remove('imgFlag', 'icoImgActive');
                    }
                    else
                    {
                        domClass.add('imgFlag', 'icoImgActive');
                    }
                    hideLoadingIndicator();
                    savingFlag = false;
                },
                function (err)
                {
                    hideLoadingIndicator();
                    alert(err);
                    savingFlag = false;
                },
                "CordovaHttpService",
                action,
                [{anno_id: id}]

            );
        };

        var startX, startY, startX1, startY1;
        return {
            // simple view init
            init:function ()
            {
                eventsModel = this.loadedModels.events;

                _connectResults.push(connect.connect(window, has("ios") ? "orientationchange" : "resize", this, function (e)
                {
                    //adjustSize();
                }));

                _connectResults.push(connect.connect(dom.byId('navBtnNext'), "click", function ()
                {
                    goNextRecord();
                }));

                _connectResults.push(connect.connect(dom.byId('appNameTextBox'), "keydown", function (e)
                {
                    if (e.keyCode == 13)
                    {
                        saveAppName();
                    }
                }));

                _connectResults.push(connect.connect(dom.byId('navBtnPrevious'), "click", function ()
                {
                    goPreviousRecord();
                }));

                /*_connectResults.push(connect.connect(dom.byId('discussDivDetail'), "click", function ()
                {
                    showTextData();
                }));*/

                _connectResults.push(connect.connect(dom.byId('addCommentImg'), "click", function ()
                {
                    var text = dom.byId('addCommentTextBox').value.trim();

                    if (!text)
                    {
                        alert('Please enter comment.');
                        dom.byId('addCommentTextBox').focus();
                        return;
                    }

                    window.setTimeout(function(){
                        saveComment(text);
                    },10);

                    dom.byId('addCommentTextBox').value = '';
                    dom.byId('hiddenBtn').focus();
                }));

                _connectResults.push(connect.connect(dom.byId('imgThumbsUp'), "click", function ()
                {
                    if (domClass.contains('imgThumbsUp','icoImgActive'))
                    {
                        saveVote('remove_vote');
                    }
                    else
                    {
                        if (domClass.contains('imgFlag','icoImgActive'))
                        {
                            showToastMsg("You must unflag the annotation up.");
                            return;
                        }

                        saveVote('add_vote');
                    }
                }));

                _connectResults.push(connect.connect(dom.byId('imgFlag'), "click", function ()
                {
                    if (domClass.contains('imgFlag','icoImgActive'))
                    {
                        saveFlag('remove_flag');
                    }
                    else
                    {
                        saveFlag('add_flag');
                    }
                }));

                _connectResults.push(connect.connect(dom.byId('addCommentTextBox'), "focus", function ()
                {
                    var viewPoint = win.getBox();
                    window.setTimeout(function(){
                        domStyle.set('modelApp_detail', 'height', (viewPoint.h+400)+'px');
                    }, 500);
                }));

                _connectResults.push(connect.connect(dom.byId('addCommentTextBox'), "blur", function ()
                {
                    window.setTimeout(function(){
                        adjustAnnoCommentSize();
                    }, 500);
                }));

                _connectResults.push(connect.connect(dom.byId('addCommentTextBox'), "keydown", function (e)
                {
                    if (e.keyCode == 13)
                    {
                        var text = dom.byId('addCommentTextBox').value.trim();

                        if (!text)
                        {
                            alert('Please enter comment.');
                            dom.byId('addCommentTextBox').focus();
                            return;
                        }

                        window.setTimeout(function(){
                            saveComment(text);
                        },10);

                        dom.byId('addCommentTextBox').value = '';
                        dom.byId('hiddenBtn').focus();
                    }

                }));

                /*_connectResults.push(connect.connect(dom.byId('screenshotContainerDetail'), "touchstart", function (e)
                {
                    if( e.touches.length == 1 )
                    {
                        startX = e.touches[0].pageX;
                        startY = e.touches[0].pageY;
                    }
                }));

                _connectResults.push(connect.connect(dom.byId('screenshotContainerDetail'), "touchmove", function (e)
                {
                    if( e.touches.length == 1 )
                    {
                        var endX = e.touches[0].pageX;
                        var endY = e.touches[0].pageY;
                        if ((startX-endX) >=6 &&Math.abs(startY-endY)<10)
                        {
                            dojo.stopEvent(e);
                            showTextData();
                        }
                    }
                }));*/
                _connectResults.push(connect.connect(dom.byId('imgDetailScreenshot'), "click", function (e)
                {
                    if (!textDataAreaShown)
                        showTextData();
                }));

                _connectResults.push(connect.connect(dom.byId('textDataAreaContainer'), "touchstart", function (e)
                {
                    if( e.touches.length == 1 )
                    {
                        startX1 = e.touches[0].pageX;
                        startY1 = e.touches[0].pageY;
                    }
                }));

                _connectResults.push(connect.connect(dom.byId('textDataAreaContainer'), "touchmove", function (e)
                {
                    if( e.touches.length == 1 )
                    {
                        var endX1 = e.touches[0].pageX;
                        var endY1 = e.touches[0].pageY;

                        if ((startX1-endX1) <=-6 &&Math.abs(startY1-endY1)<10)
                        {
                            dojo.stopEvent(e);
                            hideTextData();
                        }
                    }
                }));

                _connectResults.push(connect.connect(dom.byId('editAppNameImg'), "click", function ()
                {
                    showAppNameTextBox();
                }));

                _connectResults.push(connect.connect(dom.byId('modelApp_detail'), "scroll", function (e)
                {
                    if (annoTooltipY == null) return;
                    var parentScrollTop = dom.byId('modelApp_detail').scrollTop;

                    domStyle.set(registry.byId('textTooltip').domNode, 'top', (annoTooltipY-parentScrollTop)+'px');
                }));

                drawOrangeCircle();

                dom.byId("imgDetailScreenshot").onload = screenshotImageOnload;

                cordova.exec(
                    function (data)
                    {
                        if (data&&data.current_user)
                        {
                            currentAuthor = data.current_user;
                        }
                    },
                    function (err)
                    {
                        alert(err);
                    },
                    "CordovaHttpService",
                    'get_account_name',
                    []
                );
            },
            afterActivate: function()
            {
                var cursor = this.params["cursor"];
                if (this.params["cursor"] != null)
                {
                    window.setTimeout(function(){
                        loadDetailData(cursor);
                    }, 50);
                }
                adjustSize();

                domClass.replace(registry.byId('textTooltip').domNode, "mblTooltipVisible" ,"mblTooltipHidden");
                textDataAreaShown = false;
            },
            beforeDeactivate: function()
            {
                registry.byId('textTooltip').hide();
                domStyle.set('textDataAreaContainer', 'display', 'none');
                domStyle.set("lightCoverScreenshot", "display", 'none');

                domStyle.set("imgDetailScreenshot", "opacity", '1');

                hideLoadingIndicator();
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