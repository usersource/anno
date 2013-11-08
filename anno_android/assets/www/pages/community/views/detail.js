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
        var _connectResults = [],
            eventsModel = null,
            currentIndex = 0,
            textDataAreaShown = false,
            loadingIndicator = null;
        var app = null,
            savingVote = false,
            savingFlag = false,
            screenshotMargin = 8;
        var currentAuthor = 'me',
            annoTooltipY,
            goingNextRecord = null,
            loadingDetailData = false,
            trayBarHeight = 30,
            trayScreenHeight = 0;

        var circleRadius = 17,
            level1Color = "#ff9900",
            level2Color = "#ff0000";

        var imageBaseUrl = "https://usersource-anno.appspot.com/screenshot";

        var wipeIn = function(args)
        {
            var node = args.node = dom.byId(args.node), s = node.style, o;
            var currentHeight = domStyle.get(node, "height");
            var anim = baseFX.animateProperty(lang.mixin({
                properties: {
                    height: {
                        start: function(){
                            o = s.overflow;
                            s.overflow = "hidden";
                            if(s.visibility == "hidden" || s.display == "none"){
                                s.height = "1px";
                                s.display = "";
                                s.visibility = "";
                                return 1;
                            }else{
                                var height = domStyle.get(node, "height");
                                return Math.max(height, 1);
                            }
                        },
                        end: function(){
                            return currentHeight;
                        }
                    }
                },
                onEnd: function()
                {
                    s.height.display = "none";
                    s.height = currentHeight+"px";
                    s.overflow = o;

                    if (args.onEnd)
                    {
                        args.onEnd();
                    }
                }
            }, args));

            return anim;
        };

        var wipeOut = function(args){
            var node = args.node = dom.byId(args.node), s = node.style, o;
            var currentHeight = domStyle.get(node, "height");
            var anim = baseFX.animateProperty(lang.mixin({
                properties: {
                    height: {
                        end: 1
                    }
                },
                onEnd: function()
                {
                    s.overflow = o;
                    s.display = "none";
                    s.height = currentHeight+"px";

                    if (args.onEnd)
                    {
                        args.onEnd();
                    }
                },
                beforeBegin: function()
                {
                    o = s.overflow;
                    s.overflow = "hidden";
                    s.display = "";
                }
            }, args));

            return anim;
        };

        var adjustSize = function()
        {
            var viewPoint = win.getBox();
            domStyle.set("imgDetailScreenshot", "width", (viewPoint.w-screenshotMargin)+"px");

            var h = (viewPoint.h-6);
            domStyle.set("textDataAreaContainer", "width", (viewPoint.w-6)+"px");
            domStyle.set("annoTextDetail", "width", (viewPoint.w-6-6-10-6)+"px");

            domStyle.set("textDataAreaContainer", "height", (h-40)+"px");
            trayScreenHeight = h-40;

            domStyle.set("annoCommentsContainer", "height", (h-76-30-trayBarHeight)+"px");//104

            domStyle.set("appNameTextBox", "width", (viewPoint.w-30-6-10-40)+"px");
            domStyle.set("screenshotTooltipDetail", "width", (viewPoint.w-screenshotMargin-viewPoint.w*0.10)+"px");

            domStyle.set("lightCover", {"width": (viewPoint.w)+"px", "height":(viewPoint.h)+'px'});
        };

        var screenshotImageOnload = function()
        {
            annoTooltipY = null;
            window.setTimeout(function(){

                var imgScreenshot = dom.byId('imgDetailScreenshot');
                var viewPoint = win.getBox();
                var tooltipWidget = registry.byId('textTooltip');
                var deviceRatio = parseFloat((viewPoint.w/viewPoint.h).toFixed(2));
                var orignialDeviceRatio = parseFloat((imgScreenshot.naturalWidth/imgScreenshot.naturalHeight).toFixed(2));

                var orignialRatio = imgScreenshot.naturalHeight/imgScreenshot.naturalWidth;
                var imageWidth, imageHeight;

                if (orignialDeviceRatio == deviceRatio)
                {
                    console.error('same ratio');
                    imageWidth = (viewPoint.w-screenshotMargin);
                    imageHeight = (viewPoint.w-screenshotMargin)*orignialRatio;

                    console.error("image width: "+imageWidth+", image height: "+imageHeight);

                    imgScreenshot.width = imageWidth;
                    imgScreenshot.height = imageHeight;
                }
                else if (orignialDeviceRatio < deviceRatio) // taller than current device
                {console.error('taller ratio: o:'+orignialDeviceRatio+", d:"+ deviceRatio);
                    imageWidth = Math.round((viewPoint.h-8)/orignialRatio);
                    imageHeight = (viewPoint.h-8);

                    imgScreenshot.width = imageWidth;
                    imgScreenshot.height = imageHeight;
                    imgScreenshot.style.width = imageWidth+'px';

                }
                else if (orignialDeviceRatio > deviceRatio) // wider than current device
                {console.error('wider ratio');
                    imageWidth = (viewPoint.w-screenshotMargin);
                    imageHeight = (viewPoint.w-screenshotMargin)*orignialRatio;

                    imgScreenshot.width = imageWidth;
                    imgScreenshot.height = imageHeight;
                    imgScreenshot.style.width = imageWidth+'px';
                }

                domStyle.set("lightCoverScreenshot", "width", (30)+"px");

                if (imageHeight< viewPoint.h)
                {
                    domStyle.set("lightCoverScreenshot", "height", (viewPoint.h+400)+"px");
                }
                else
                {
                    domStyle.set("lightCoverScreenshot", "height", (imageHeight+400)+"px");
                }

                imageWidth = imgScreenshot.width;
                imageHeight = imgScreenshot.height;

                var toolTipDivWidth = imageWidth - 40;
                domStyle.set("screenshotTooltipDetail", "width", toolTipDivWidth+"px");

                if (eventsModel.cursor.circleX != null)
                {
                    var tx = (imageWidth*eventsModel.cursor.circleX)/10000 -circleRadius;
                    var ty = (imageHeight*eventsModel.cursor.circleY)/10000 -circleRadius;

                    console.error("view w: "+viewPoint.w+", view h: "+viewPoint.h);
                    console.error("image width2: "+imageWidth+", image height2: "+imageHeight);
                    console.error("x: "+tx+", y: "+ty);

                    domStyle.set("screenshotAnchorDetail", {
                        top: ty+'px',
                        left: tx+'px',
                        display: ''
                    });

                    domStyle.set("screenshotAnchorInvisibleDetail", {
                        top: ty+'px'
                    });

                    if (ty > (domStyle.get("screenshotTooltipDetail", "height")+14))
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

                adjustNavBarZIndex();

                if (goingNextRecord != null)
                {
                    if (goingNextRecord)
                    {
                        transit(null, dom.byId('screenshotContainerDetail'), {
                            transition:"slide",
                            duration:600
                        });
                    }
                    else
                    {
                        transit(null, dom.byId('screenshotContainerDetail'), {
                            transition:"slide",
                            duration:600,
                            reverse: true
                        });
                    }
                }

                adjustNavBarSize();

            }, 10);
        };

        var setDetailsContext = function (index)
        {
            // only set the cursor if it is different and valid
            var idx = parseInt(index);
            if (idx < eventsModel.model.length)
            {
                console.error("level:"+eventsModel.cursor.level);
                applyAnnoLevelColor(eventsModel.cursor.level);

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

                // was (viewPoint.w-30-viewPoint.w*0.10)
                var toolTipDivWidth = (viewPoint.w-30-viewPoint.w*0.10),
                    pxPerChar = 8,
                    charsPerLine = toolTipDivWidth/pxPerChar;

                if (eventsModel.cursor.annoText.length >= charsPerLine*3)
                {
                    var shortText = eventsModel.cursor.annoText.substr(0, charsPerLine*3-3)+"...";

                    dom.byId('screenshotTooltipDetail').innerHTML = shortText;
                }

                //dom.byId("imgDetailScreenshot").width = (viewPoint.w-30);
                domStyle.set("screenshotTooltipDetail", "width", toolTipDivWidth+"px");


                if (eventsModel.cursor.app == null||eventsModel.cursor.app == ''||eventsModel.cursor.app.toLowerCase() == 'unknown')
                {
                    domStyle.set('editAppNameImg', 'display', '');
                    dom.byId('appNameSpanDetail').innerHTML = "Unknown";
                }
                else
                {
                    domStyle.set('editAppNameImg', 'display', 'none');
                }

                if (eventsModel.cursor.vote == true)
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

                if (eventsModel.cursor.flag == true)
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

        var applyAnnoLevelColor = function(level)
        {
            level = level||1;
            if (level == 1)
            {
                domStyle.set('imgDetailScreenshot', 'borderColor', level1Color);
                drawOrangeCircle(1);
            }
            else if (level == 2)
            {
                domStyle.set('imgDetailScreenshot', 'borderColor', level2Color);
                console.error(domStyle.get('imgDetailScreenshot', 'border'));
                drawOrangeCircle(2);
            }
        };

        var adjustAnnoCommentSize = function()
        {
            var annoContainer = dom.byId('annoCommentsContainer');
            var parentBox = domGeom.getMarginBox("headingDetail");
            var viewPoint = win.getBox();
            var h = (viewPoint.h-6);

            domStyle.set("annoCommentsContainer", "height", (h-76-30-trayBarHeight)+"px")
            if (annoContainer.scrollHeight > annoContainer.clientHeight)
            {
                domStyle.set("annoCommentsContainer", "height", (h-76-30-trayBarHeight)+"px");
                domStyle.set("trayPlaceHolder", "height", "0px");
            }
            else
            {
                domStyle.set("annoCommentsContainer", "height", 'auto');
                var th = domStyle.get("textDataAreaContainer", "height");
                var h = domStyle.get("annoCommentsContainer", "height");

                domStyle.set("trayPlaceHolder", "height", (th-h-95)+"px");
            }

            var ach = domGeom.getMarginBox("annoCommentsSet");
            if ((ach.h +parentBox.h+30) > (viewPoint.h-400))
            {
                domStyle.set("lightCoverScreenshot", "height", (ach.h +parentBox.h+30+400)+"px");
            }
        };

        var adjustNavBarSize = function ()
        {
            var scSize = domGeom.getMarginBox('screenshotContainerDetail');
            domStyle.set('headingDetail', 'width', (scSize.w-6)+'px');
        };

        var adjustNavBarZIndex = function()
        {

        };

        var goNextRecord = function()
        {
            if ( (currentIndex+1)< eventsModel.model.length)
            {
                window.setTimeout(function(){
                    loadDetailData(currentIndex+1);
                    goingNextRecord = true;
                }, 50);
            }
        };

        var goPreviousRecord = function()
        {
            if ( (currentIndex-1)>=0)
            {
                window.setTimeout(function(){
                    loadDetailData(currentIndex-1);
                    goingNextRecord = false;
                }, 50);
            }
        };

        var showTextData = function()
        {
            if (textDataAreaShown) return;

            if (window.CMActivity)
            {
                window.CMActivity.disableBackButton();
            }

            domStyle.set("imgDetailScreenshot", "opacity", '0.4');
            wipeIn({
                node:"textDataAreaContainer",
                duration: 600,
                onEnd:function()
                {
                    domStyle.set("textDataAreaContainer", "height", trayScreenHeight+"px");
                    adjustAnnoCommentSize();
                }
            }).play();
            registry.byId('textTooltip').hide();

            textDataAreaShown = true;
            domStyle.set("headingDetail", "display", 'none');
        };

        var hideTextData = window.hideTrayScreen = function()
        {
            if (!textDataAreaShown) return;
            if (window.CMActivity)
            {
                window.CMActivity.enableBackButton();
            }

            domStyle.set("lightCoverScreenshot", "display", 'none');
            domStyle.set("imgDetailScreenshot", "opacity", '1');
            wipeOut({
                node:"textDataAreaContainer",
                duration: 600,
                onEnd:function()
                {
                    domStyle.set("textDataAreaContainer", {"height": trayScreenHeight+"px", display:'none'});
                }
            }).play();

            domClass.replace(registry.byId('textTooltip').domNode, "mblTooltipVisible" ,"mblTooltipHidden");

            textDataAreaShown = false;

            domStyle.set("headingDetail", "display", '');
        };

        var drawOrangeCircle = function(level)
        {
            level = level||1;
            var lineColor, fillColor;

            if (level == 1)
            {
                lineColor = "#FFA500";
                fillColor = "rgba(255,165,0, 0.4)";
            }
            else
            {
                lineColor = "#FF0000";
                fillColor = "rgba(255,12,9, 0.4)";
            }

            var ctx = dom.byId('screenshotAnchorDetail').getContext('2d');
            var canvasWidth = 32;

            ctx.clearRect(0, 0, 40, 40);
            ctx.beginPath();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 3;
            ctx.arc(20, 20, canvasWidth/2, 0, 2 * Math.PI, true);
            ctx.stroke();
            ctx.fillStyle = fillColor;
            ctx.arc(20, 20, canvasWidth/2-3, 0, 2 * Math.PI, true);
            ctx.fill();
        };

        var showAppNameTextBox = function()
        {
            domStyle.set('editAppNameImg', 'display', 'none');

            var pos = domGeom.position('appNameSpanDetail', true);

            domStyle.set('appNameSpanDetail', 'display', 'none');
            domStyle.set('appNameTextBox', {display: '', top:pos.y+'px', left:pos.x+'px'});
            //domStyle.set('lightCover', 'display', '');

            window.setTimeout(function(){
                dom.byId('appNameTextBox').click();
                dom.byId('appNameTextBox').focus();
                //domStyle.set('lightCover', {'display': '','backgroundColor':'#000000', 'opacity':'0.8'});
            },300);
            dom.byId('hiddenBtn').focus();

            dom.byId('appNameTextBox').value = dom.byId('appNameSpanDetail').innerHTML == 'Unknown'?'':dom.byId('appNameSpanDetail').innerHTML;
        };

        var saveAppName = function()
        {
            var newAppName = dom.byId('appNameTextBox').value.trim();
            var id = eventsModel.cursor.id;

            if (newAppName.length <=0)
            {
                newAppName = "Unknown";
                dom.byId('hiddenBtn').focus();

                domStyle.set('appNameSpanDetail', 'display', '');
                domStyle.set('appNameTextBox', {display: 'none'});
                domStyle.set('lightCover', 'display', 'none');
                domStyle.set('editAppNameImg', 'display', '');
            }

            showLoadingIndicator();

            var annoApi = gapi.client.anno.anno.merge({id:id, app_name:newAppName});
            annoApi.execute(function (data)
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
                }

                if (data.error)
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
                console.error(JSON.stringify(data.result));

                var currentAnno = eventsModel.cursor;
                currentAnno.set('app', newAppName);

                hideLoadingIndicator();
                dom.byId('hiddenBtn').focus();

                domStyle.set('appNameSpanDetail', 'display', '');
                domStyle.set('appNameTextBox', {display: 'none'});
                domStyle.set('lightCover', 'display', 'none');
                domStyle.set('editAppNameImg', 'display', '');
            });
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
            if (loadingDetailData) return;

            loadingDetailData = true;
            var previousAnno = eventsModel.cursor||eventsModel.model[0];

            if (previousAnno)
            {
                previousAnno.set('screenshot', "data:image/png;base64,");
            }

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

            dom.byId('imgDetailScreenshot').src = imageBaseUrl+"?anno_id="+id;
            console.error("image url: "+imageBaseUrl+"?anno_id="+id);

            showLoadingIndicator();

            var getAnnoList = gapi.client.anno.anno.get({id:id});
            getAnnoList.execute(function (data)
            {
                if (!data)
                {
                    hideLoadingIndicator();
                    loadingDetailData = false;
                    alert("Annos returned from server are empty.");
                    return;
                }

                if (data.error)
                {
                    hideLoadingIndicator();
                    loadingDetailData = false;

                    alert("An error occurred when calling anno.get api: "+data.error.message);
                    return;
                }
                console.error(JSON.stringify(data.result));
                var currentAnno = eventsModel.cursor||eventsModel.model[0], returnAnno = data.result, deviceInfo = '';

                currentAnno.set('circleX', parseInt(returnAnno.simple_x, 10));
                currentAnno.set('circleY', parseInt(returnAnno.simple_y, 10));

                currentAnno.set('comments',new getStateful(returnAnno.followup_list||[]));

                deviceInfo = (returnAnno.device_model||'&nbsp;')+'&nbsp;'+(returnAnno.os_name||'&nbsp;')+(returnAnno.os_version||'&nbsp;');
                currentAnno.set('deviceInfo', deviceInfo);

                currentAnno.set('vote', returnAnno.is_my_vote);
                currentAnno.set('flag', returnAnno.is_my_flag);
                currentAnno.set('level', returnAnno.level);

                loadingDetailData = false;
                hideLoadingIndicator();
                setDetailsContext(cursor);

            });
        };

        var saveComment = function(comment)
        {
            var author = currentUserInfo.email;
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

            var getAnnoList = gapi.client.followup.followup.insert({anno_id:id, comment:comment});
            getAnnoList.execute(function (data)
            {
                if (!data)
                {
                    hideLoadingIndicator();
                    alert("Annos returned from server are empty.");
                    return;
                }

                if (data.error)
                {
                    hideLoadingIndicator();
                    alert("An error occurred when calling anno.get api: "+data.error.message);
                    return;
                }
                console.error(JSON.stringify(data.result));

                var currentAnno = eventsModel.cursor||eventsModel.model[0];

                hideLoadingIndicator();
                currentAnno.comments.splice(0,0,new getStateful({user_id:author, comment:comment}));
                adjustAnnoCommentSize();
            });
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

            var voteApi, apiName;

            if (action == "add_vote")
            {
                voteApi = gapi.client.vote.vote.insert({anno_id:id});
                apiName = "vote.insert";
            }
            else
            {
                voteApi = gapi.client.vote.vote.delete({anno_id:id});
                apiName = "vote.delete";
            }

            voteApi.execute(function (data)
            {
                if (!data)
                {
                    hideLoadingIndicator();
                    alert("vote api result returned from server are empty.");
                    savingVote = false;
                    return;
                }

                if (data.error)
                {
                    hideLoadingIndicator();

                    alert("An error occurred when calling "+apiName+" api: "+data.error.message);
                    savingVote = false;
                    return;
                }
                console.error(JSON.stringify(data.result));

                if (action == "remove_vote")
                {
                    domClass.remove('imgThumbsUp', 'icoImgActive');
                }
                else
                {
                    domClass.add('imgThumbsUp', 'icoImgActive');
                }

                savingVote = false;
                hideLoadingIndicator();
            });
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

            var flatApi, apiName;

            if (action == "add_flag")
            {
                flatApi = gapi.client.flag.flag.insert({anno_id:id});
                apiName = "flag.insert";
            }
            else
            {
                flatApi = gapi.client.flag.flag.delete({anno_id:id});
                apiName = "flag.delete";
            }

            flatApi.execute(function (data)
            {
                if (!data)
                {
                    hideLoadingIndicator();
                    alert("vote api result returned from server are empty.");
                    savingFlag = false;
                    return;
                }

                if (data.error)
                {
                    hideLoadingIndicator();

                    alert("An error occurred when calling "+apiName+" api: "+data.error.message);
                    savingFlag = false;
                    return;
                }
                console.error(JSON.stringify(data.result));

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
            });
        };

        var touchStartOnTrayScreen = function(e)
        {
            if( e.touches.length == 1 )
            {
                startX1 = e.touches[0].pageX;
                startY1 = e.touches[0].pageY;
            }
        };

        var touchMoveOnTrayScreen = function(e)
        {
            if( e.touches.length == 1 )
            {
                var endX1 = e.touches[0].pageX;
                var endY1 = e.touches[0].pageY;

                if (Math.abs(startX1-endX1) <10 &&startY1-endY1>=6)
                {
                    dojo.stopEvent(e);
                    hideTextData();
                }
            }
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

                _connectResults.push(connect.connect(dom.byId('navBtnTray'), "click", function ()
                {
                    if (textDataAreaShown)
                    {
                        hideTextData();
                    }
                    else
                    {
                        showTextData();
                    }
                }));

                _connectResults.push(connect.connect(dom.byId('appNameTextBox'), "keydown", function (e)
                {
                    if (e.keyCode == 13)
                    {
                        saveAppName();
                    }
                }));

                _connectResults.push(connect.connect(dom.byId('appNameTextBox'), "blur", function (e)
                {
                    dom.byId('hiddenBtn').focus();

                    domStyle.set('appNameSpanDetail', 'display', '');
                    domStyle.set('appNameTextBox', {display: 'none'});
                    domStyle.set('lightCover', 'display', 'none');
                    domStyle.set('editAppNameImg', 'display', '');
                }));

                _connectResults.push(connect.connect(dom.byId('navBtnPrevious'), "click", function ()
                {
                    goPreviousRecord();
                }));

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
                        domStyle.set("lightCoverScreenshot", "display", '');
                    }, 500);
                }));

                _connectResults.push(connect.connect(dom.byId('addCommentTextBox'), "blur", function ()
                {
                    window.setTimeout(function(){
                        var viewPoint = win.getBox();
                        adjustAnnoCommentSize();
                        domStyle.set('modelApp_detail', 'height', (viewPoint.h)+'px');
                        domStyle.set("lightCoverScreenshot", "display", 'none');
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

                _connectResults.push(connect.connect(dom.byId('screenshotContainerDetail'), "touchstart", function (e)
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
                            goNextRecord();
                        }
                        else if ((startX-endX) <=-6 &&Math.abs(startY-endY)<10)
                        {
                            dojo.stopEvent(e);
                            goPreviousRecord();
                        }
                    }
                }));
                _connectResults.push(connect.connect(dom.byId('imgDetailScreenshot'), "click", function (e)
                {
                    if (!textDataAreaShown)
                        showTextData();
                }));

                _connectResults.push(connect.connect(dom.byId('bottomPlaceholder'), "touchstart", touchStartOnTrayScreen));

                _connectResults.push(connect.connect(dom.byId('bottomPlaceholder'), "touchmove", touchMoveOnTrayScreen));

                _connectResults.push(connect.connect(dom.byId('trayPlaceHolder'), "touchstart", touchStartOnTrayScreen));

                _connectResults.push(connect.connect(dom.byId('trayPlaceHolder'), "touchmove", touchMoveOnTrayScreen));

                _connectResults.push(connect.connect(dom.byId('trayBottomBar'), "touchstart", function(e)
                {
                    if( e.touches.length == 1 )
                    {
                        startX1 = e.touches[0].pageX;
                        startY1 = e.touches[0].pageY;

                        domStyle.set('trayBottomBarSpin', 'backgroundColor', '#ff9900');
                    }
                }));

                _connectResults.push(connect.connect(dom.byId('trayBottomBar'), "touchend", function(e)
                {
                    domStyle.set('trayBottomBarSpin', 'backgroundColor', 'gray');
                }));

                _connectResults.push(connect.connect(dom.byId('trayBottomBar'), "touchmove", touchMoveOnTrayScreen));

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
                domStyle.set('modelApp_detail','backgroundColor', '#333333');

            },
            afterActivate: function()
            {
                goingNextRecord = null;
                loadingDetailData = false;

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
                domStyle.set("headingDetail", "display", '');
            },
            beforeDeactivate: function()
            {
                registry.byId('textTooltip').hide();
                domStyle.set('textDataAreaContainer', 'display', 'none');
                domStyle.set("lightCoverScreenshot", "display", 'none');

                domStyle.set("imgDetailScreenshot", "opacity", '1');

                hideLoadingIndicator();

                if (window.CMActivity)
                {
                    window.CMActivity.enableBackButton();
                }
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