define([
    "dojo/_base/array",
    "dojo/_base/fx",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/json",
    "dojo/query",
    "dojo/_base/lang",
    "dojo/_base/connect",
    "dojo/window",
    "dojo/has",
    "dojo/sniff",
    "dijit/registry",
    "dojox/css3/transit",
    "dojo/store/Memory",
    "dojox/mvc/getStateful",
    "dojox/mvc/at",
    "anno/draw/Surface",
    "anno/common/Util",
    "anno/common/OAuthUtil"
],
    function (arrayUtil, baseFX, dom, domClass, domGeom, domStyle, dojoJson, query, lang, connect, win, has, sniff, registry, transit, Memory, getStateful, at, Surface, annoUtil, OAuthUtil)
    {
        var _connectResults = [],
            eventsModel = null,
            currentIndex = 0,
            textDataAreaShown = false,
            loadingIndicator = null;
        var app = null,
            savingVote = false,
            savingFlag = false,
            localScreenshotPath = "",
            screenshotMargin = 0;
        var annoTooltipY,
            goingNextRecord = null,
            loadingDetailData = false,
            loadingImage = false,
            trayBarHeight = 30,
            navBarHeight = 50,
            trayScreenHeight = 0,
            borderWidth;

        var imageBaseUrl = annoUtil.getCEAPIConfig().imageServiceURL;
        var surface;
        var imageWidth, imageHeight;

        var wipeIn = function(args)
        {
            var node = args.node = dom.byId(args.node);
            var currentHeight = domStyle.get(node, "height");
            node.style.WebkitTransform = "translateY("+navBarHeight+"px)";
        };

        var wipeOut = function(args){
            var node = args.node = dom.byId(args.node);
            var viewPoint = win.getBox();
            node.style.WebkitTransform = "translateY(-"+(viewPoint.h-6)+"px)";

            window.setTimeout(function(){
                node.style.display = "none";
            }, 600);
        };

        var adjustSize = function()
        {
            var viewPoint = win.getBox();
            domStyle.set("imgDetailScreenshot", "width", (viewPoint.w-screenshotMargin)+"px");

            var h = (viewPoint.h-6);
            domStyle.set("textDataAreaContainer", "width", (viewPoint.w-6)+"px");
            domStyle.set("annoTextDetail", "width", (viewPoint.w-6-6-10-6-28)+"px");
            domStyle.set("voteFlagContainer", "width", (viewPoint.w-6-6-10-6-28)+"px");

            domStyle.set("textDataAreaContainer", "height", (h-40-navBarHeight)+"px");
            dom.byId("textDataAreaContainer").style.WebkitTransform = "translateY(-"+(h)+"px)";
            trayScreenHeight = h-40;

            domStyle.set("annoCommentsContainer", "height", (h-76-30-trayBarHeight)+"px");//104

            domStyle.set("appNameTextBox", "width", (viewPoint.w-30-6-10-40)+"px");
            domStyle.set("lightCover", {"width": (viewPoint.w)+"px", "height":(viewPoint.h)+'px'});
            domStyle.set("lightCoverScreenshot", "height", (viewPoint.h+800)+"px");
        };

        var screenshotImageOnload = function()
        {
            console.error("screenshot loaded.");
            if (!loadingDetailData)
            {
                annoUtil.hideLoadingIndicator();
            }

            loadingImage = false;
            annoTooltipY = null;
            window.setTimeout(function(){

                var imgScreenshot = dom.byId('imgDetailScreenshot');
                var viewPoint = win.getBox();
                var deviceRatio = parseFloat((viewPoint.w/viewPoint.h).toFixed(2));
                var orignialDeviceRatio = parseFloat((imgScreenshot.naturalWidth/imgScreenshot.naturalHeight).toFixed(2));
                var orignialRatio = imgScreenshot.naturalHeight/imgScreenshot.naturalWidth;

                if (orignialDeviceRatio == deviceRatio)
                {
                    console.error('same ratio');
                    imageHeight = viewPoint.h - navBarHeight;
                    imageWidth = Math.round(imageHeight/orignialRatio);

                    console.error("image width: "+imageWidth+", image height: "+imageHeight);
                }
                else if (orignialDeviceRatio < deviceRatio) // taller than current device
                {console.error('taller ratio: o:'+orignialDeviceRatio+", d:"+ deviceRatio);
                    imageHeight = viewPoint.h-navBarHeight;
                    imageWidth = Math.round(imageHeight/orignialRatio);
                }
                else if (orignialDeviceRatio > deviceRatio) // wider than current device
                {console.error('wider ratio');
                    imageHeight = (viewPoint.w-screenshotMargin)*orignialRatio - navBarHeight;
                    imageWidth = Math.round(imageHeight/orignialRatio);
                }

                domStyle.set("lightCoverScreenshot", "width", (30)+"px");

                if (imageHeight< viewPoint.h)
                {
                    domStyle.set("lightCoverScreenshot", "height", (viewPoint.h+800)+"px");
                }
                else
                {
                    domStyle.set("lightCoverScreenshot", "height", (imageHeight+800)+"px");
                }

                borderWidth = Math.floor(imageWidth*0.02);
                applyAnnoLevelColor(eventsModel.cursor.level);

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

                redrawShapes();
            }, 10);
        };

        var screenshotImageOnerror = function()
        {
            console.error("screenshot loaded error.");
            loadingImage = false;
            if (!loadingDetailData)
            {
                annoUtil.hideLoadingIndicator();
            }

            surface.clear();
            surface.hide();
        };

        var redrawShapes = function()
        {
            var drawElements = eventsModel.cursor.draw_elements;
            var lineStrokeStyle = {color: eventsModel.cursor.level==1?annoUtil.level1Color:annoUtil.level2Color, width: 3};
            if (drawElements)
            {
                var elementsObject = dojoJson.parse(drawElements);

                surface.show();
                domStyle.set(surface.container, {'border': borderWidth+'px solid transparent', left:(-borderWidth)+'px',top:(-borderWidth)+'px'});

                surface.borderWidth = borderWidth;
                surface.setDimensions(imageWidth-borderWidth*2, imageHeight-borderWidth*2);

                surface.parse(elementsObject, lineStrokeStyle);

                console.error('redrawShapes end');
            }
            else
            {

                domStyle.set(surface.container, {'border': borderWidth+'px solid transparent', left:(-borderWidth)+'px',top:(-borderWidth)+'px'});

                surface.borderWidth = borderWidth;
                surface.setDimensions(imageWidth-borderWidth*2, imageHeight-borderWidth*2);

                surface.clear();
                surface.show();

                var earLow = !eventsModel.cursor.simple_circle_on_top;

                var toolTipDivWidth = (imageWidth-borderWidth*2-60),
                    pxPerChar = 8,
                    charsPerLine = toolTipDivWidth/pxPerChar;

                var commentText = eventsModel.cursor.annoText;
                var lines = Math.max(Math.round(commentText.length/charsPerLine),1);

                if (lines > 4 )
                {
                    lines = 4;
                    //var shortText = commentText.substr(0, charsPerLine*4-10)+"...";
                    //commentText = shortText;
                }

                var boxHeight = 34 + (lines-1)*22;
                var epLineStyle, epFillStyle;

                if (eventsModel.cursor.level==1)
                {
                    epLineStyle = {color:annoUtil.level1Color, width:1};
                    epFillStyle = "rgba("+annoUtil.level1ColorRGB+", 0.4)";
                }
                else
                {
                    epLineStyle = {color:annoUtil.level2Color,width:1};
                    epFillStyle = "rgba("+annoUtil.level2ColorRGB+", 0.4)";
                }

                var tx = Math.round(((imageWidth-borderWidth*2)*eventsModel.cursor.circleX)/10000);
                var ty = Math.round(((imageHeight-borderWidth*2)*eventsModel.cursor.circleY)/10000);

                var commentBox = surface.createSimpleCommentBox({
                    deletable:false,
                    startX:tx,
                    startY: ty,
                    selectable:false,
                    shareBtnWidth:0,
                    boxHeight:boxHeight,
                    earLow:earLow,
                    placeholder:commentText,
                    commentText:eventsModel.cursor.annoText,
                    lineStrokeStyle:lineStrokeStyle,
                    endpointStrokeStyle:epLineStyle,
                    endpointFillStyle:epFillStyle
                });
            }
        };

        var setDetailsContext = function (index)
        {
            // only set the cursor if it is different and valid
            var idx = parseInt(index);
            if (idx < eventsModel.model.length)
            {
                console.error("level:"+eventsModel.cursor.level);
                //applyAnnoLevelColor(eventsModel.cursor.level);

                eventsModel.set("cursorIndex", idx);
                currentIndex = idx;

                domClass.remove('imgFlag', 'icoImgActive');
                domClass.remove('imgThumbsUp', 'icoImgActive');

                if (idx == 0)
                {
                    if (eventsModel.model.length>1)
                    {
                        domClass.remove("navBtnNext", "navBtnDisabled");
                    }
                    else
                    {
                        domClass.add("navBtnNext", "navBtnDisabled");
                    }

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
            borderWidth = Math.floor(imageWidth*0.02);
            level = level||1;
            if (level == 1)
            {
                console.error("img width:"+(imageWidth-borderWidth*2));

                domStyle.set('screenshotContainerDetail', {width:(imageWidth-borderWidth*2)+'px',height:(imageHeight-borderWidth*2)+'px', 'borderColor': annoUtil.level1Color,'borderStyle':'solid', 'borderWidth':borderWidth+'px'});
                domStyle.set('imgDetailScreenshot', {width:'100%',height:'100%'});
            }
            else if (level == 2)
            {
                domStyle.set('screenshotContainerDetail', {width:(imageWidth-borderWidth*2)+'px',height:(imageHeight-borderWidth*2)+'px', 'borderColor': annoUtil.level2Color,'borderStyle':'solid', 'borderWidth':borderWidth+'px'});
                domStyle.set('imgDetailScreenshot', {width:'100%',height:'100%'});
            }
        };

        var adjustAnnoCommentSize = function()
        {
            var annoContainer = dom.byId('annoCommentsContainer');
            var parentBox = domGeom.getMarginBox("headingDetail");
            var viewPoint = win.getBox();
            var h = (viewPoint.h-6);

            domStyle.set("annoCommentsContainer", "height", (h-76-66-30-trayBarHeight)+"px");
            if (annoContainer.scrollHeight > annoContainer.clientHeight)
            {
                domStyle.set("annoCommentsContainer", "height", (h-76-66-30-trayBarHeight)+"px");
                domStyle.set("trayPlaceHolder", "height", "0px");
            }
            else
            {
                domStyle.set("annoCommentsContainer", "height", 'auto');
                var th = domStyle.get("textDataAreaContainer", "height");
                var h = domStyle.get("annoCommentsContainer", "height");

                domStyle.set("trayPlaceHolder", "height", (th-h-106 - 22)+"px");
            }

            var ach = domGeom.getMarginBox("annoCommentsSet");
            if ((ach.h +parentBox.h+72) > (viewPoint.h-800))
            {
                domStyle.set("lightCoverScreenshot", "height", (ach.h +parentBox.h+72+800)+"px");
            }
        };

        var adjustNavBarSize = function ()
        {

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

            domStyle.set("textDataAreaContainer", "display", "");
            domClass.remove("navBtnScreenshot", "barIconHighlight");
            domClass.add("navBtnTray", "barIconHighlight");

            window.setTimeout(function(){
                wipeIn({
                    node:"textDataAreaContainer"
                });
            }, 100);

            window.setTimeout(function(){
                adjustAnnoCommentSize();
                textDataAreaShown = true;
                domStyle.set("bottomPlaceholder", "display", '');
                domStyle.set("imgDetailScreenshot", "opacity", '0.4');

            }, 600);

            document.addEventListener("backbutton", handleBackButton, false);
        };

        var handleBackButton = function()
        {
            hideTextData();
        };

        var hideTextData = function()
        {
            if (!textDataAreaShown) return;

            domStyle.set("lightCoverScreenshot", "display", 'none');
            domStyle.set("imgDetailScreenshot", "opacity", '1');
            wipeOut({
                node:"textDataAreaContainer"
            });

            textDataAreaShown = false;

            domStyle.set("bottomPlaceholder", "display", 'none');
            domClass.add("navBtnScreenshot", "barIconHighlight");
            domClass.remove("navBtnTray", "barIconHighlight");
            document.removeEventListener("backbutton", handleBackButton, false);
        };

        var showAppNameTextBox = function()
        {
            domStyle.set('editAppNameImg', 'display', 'none');

            var pos = domGeom.position('appNameSpanDetail', true);

            domStyle.set('appNameSpanDetail', 'display', 'none');
            domStyle.set('appNameTextBox', {display: '', top:pos.y+'px', left:pos.x+'px'});

            window.setTimeout(function(){
                dom.byId('appNameTextBox').click();
                dom.byId('appNameTextBox').focus();
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

            annoUtil.showLoadingIndicator();
            OAuthUtil.getAccessToken(function(){
                annoUtil.loadAPI(annoUtil.API.anno, function(){
                    var annoApi = gapi.client.anno.anno.merge({id:id, app_name:newAppName});
                    annoApi.execute(function (data)
                    {
                        if (!data)
                        {
                            annoUtil.hideLoadingIndicator();

                            dom.byId('hiddenBtn').focus();

                            domStyle.set('appNameSpanDetail', 'display', '');
                            domStyle.set('appNameTextBox', {display: 'none'});
                            domStyle.set('lightCover', 'display', 'none');
                            domStyle.set('editAppNameImg', 'display', '');

                            alert("Update app name returned from server is empty.");
                        }

                        if (data.error)
                        {
                            annoUtil.hideLoadingIndicator();

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

                        annoUtil.hideLoadingIndicator();
                        dom.byId('hiddenBtn').focus();

                        domStyle.set('appNameSpanDetail', 'display', '');
                        domStyle.set('appNameTextBox', {display: 'none'});
                        domStyle.set('lightCover', 'display', 'none');
                        domStyle.set('editAppNameImg', 'display', '');
                    });
                });
            });
        };

        var showLocalAnno = function()
        {
            var currentAnno = eventsModel.cursor;
            dom.byId('imgDetailScreenshot').src = localScreenshotPath+"/"+currentAnno.screenshot_key;
        };

        var loadDetailData = function(cursor)
        {
            if (loadingDetailData||loadingImage) return;

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

            if (id == null)
            {
                loadingDetailData = false;
                domStyle.set('voteFlagContainer', 'visibility', 'hidden');
                domStyle.set('addCommentContainer', 'visibility', 'hidden');
                showLocalAnno();
                setDetailsContext(cursor);
                return;
            }
            else
            {
                domStyle.set('voteFlagContainer', 'visibility', 'visible');
                domStyle.set('addCommentContainer', 'visibility', 'visible');
            }

            loadingImage = true;
            dom.byId('imgDetailScreenshot').src = imageBaseUrl+"?anno_id="+id;
            console.error("image url: "+imageBaseUrl+"?anno_id="+id);

            annoUtil.showLoadingIndicator();

            OAuthUtil.getAccessToken(function(){
                annoUtil.loadAPI(annoUtil.API.anno, function(){
                    var getAnnoList = gapi.client.anno.anno.get({id:id});
                    getAnnoList.execute(function (data)
                    {
                        if (!data)
                        {
                            annoUtil.hideLoadingIndicator();
                            loadingDetailData = false;
                            alert("Items returned from server are empty.");
                            return;
                        }

                        if (data.error)
                        {
                            annoUtil.hideLoadingIndicator();
                            loadingDetailData = false;

                            alert("An error occurred when calling anno.get api: "+data.error.message);
                            return;
                        }
                        console.error(JSON.stringify(data.result));
                        var currentAnno = eventsModel.cursor||eventsModel.model[0], returnAnno = data.result, deviceInfo = '';

                        currentAnno.set('circleX', parseInt(returnAnno.simple_x, 10));
                        currentAnno.set('circleY', parseInt(returnAnno.simple_y, 10));

                        if (returnAnno.followup_list)
                        {
                            for (var j=0;j<returnAnno.followup_list.length;j++)
                            {
                                returnAnno.followup_list[j].user_id = returnAnno.followup_list[j].creator.display_name||returnAnno.followup_list[j].creator.user_email||returnAnno.followup_list[j].creator.id;
                            }
                        }

                        currentAnno.set('comments',new getStateful(returnAnno.followup_list||[]));

                        deviceInfo = (returnAnno.device_model||'&nbsp;')+'&nbsp;'+(returnAnno.os_name||'&nbsp;')+(returnAnno.os_version||'&nbsp;');
                        currentAnno.set('deviceInfo', deviceInfo);

                        currentAnno.set('vote', returnAnno.is_my_vote);
                        currentAnno.set('flag', returnAnno.is_my_flag);
                        currentAnno.set('level', returnAnno.level);
                        currentAnno.set('draw_elements', returnAnno.draw_elements||"");

                        loadingDetailData = false;

                        if (!loadingImage)
                        {
                            annoUtil.hideLoadingIndicator();
                            redrawShapes();
                        }

                        setDetailsContext(cursor);

                    });
                });
            });
        };

        var saveComment = function(comment)
        {
            var author = currentUserInfo.nickname;
            var id;
            if (!eventsModel.cursor)
            {
                id = eventsModel.model[0].id;
            }
            else
            {
                id = eventsModel.cursor.id;
            }

            annoUtil.showLoadingIndicator();

            OAuthUtil.getAccessToken(function(){
                annoUtil.loadAPI(annoUtil.API.followUp, function(){
                    var getAnnoList = gapi.client.followup.followup.insert({anno_id:id, comment:comment});
                    getAnnoList.execute(function (data)
                    {
                        if (!data)
                        {
                            annoUtil.hideLoadingIndicator();
                            alert("Items returned from server are empty.");
                            return;
                        }

                        if (data.error)
                        {
                            annoUtil.hideLoadingIndicator();
                            alert("An error occurred when calling anno.get api: "+data.error.message);
                            return;
                        }
                        console.error(JSON.stringify(data.result));

                        var currentAnno = eventsModel.cursor||eventsModel.model[0];

                        annoUtil.hideLoadingIndicator();
                        currentAnno.comments.splice(0,0,new getStateful({user_id:author, comment:comment}));
                        adjustAnnoCommentSize();
                    });
                });
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

            annoUtil.showLoadingIndicator();

            OAuthUtil.getAccessToken(function(){
                annoUtil.loadAPI(annoUtil.API.vote, function(){
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
                            annoUtil.hideLoadingIndicator();
                            alert("vote api result returned from server are empty.");
                            savingVote = false;
                            return;
                        }

                        if (data.error)
                        {
                            annoUtil.hideLoadingIndicator();

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
                        annoUtil.hideLoadingIndicator();
                    });
                });
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

            annoUtil.showLoadingIndicator();

            OAuthUtil.getAccessToken(function(){
                annoUtil.loadAPI(annoUtil.API.flag, function(){
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
                            annoUtil.hideLoadingIndicator();
                            alert("vote api result returned from server are empty.");
                            savingFlag = false;
                            return;
                        }

                        if (data.error)
                        {
                            annoUtil.hideLoadingIndicator();

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
                        annoUtil.hideLoadingIndicator();
                        savingFlag = false;
                    });
                });
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

                if (Math.abs(startX1-endX1) <10 &&(startY1-endY1)>=6)
                {
                    dojo.stopEvent(e);
                    hideTextData();
                }
                else if (startY1 > endY1)
                {
                    dojo.stopEvent(e);
                }
            }
        };

        var doSocialShare = function()
        {
            var id = eventsModel.cursor.id, annoText = eventsModel.cursor.annoText;
            var subject = "Suggestion for "+eventsModel.cursor.app + ": ";

            if (annoText.length >25)
            {
                annoText = annoText.substr(0, 25) + "...";
            }

            subject = subject + annoText;

            window.plugins.socialsharing.share(
                '',
                subject,
                null,
                annoUtil.annoPermaLinkBaseUrl+id);
        };

        var startX, startY, startX1, startY1;
        return {
            // simple view init
            init:function ()
            {
                eventsModel = this.loadedModels.events;
                localScreenshotPath = annoUtil.getAnnoScreenshotPath();

                _connectResults.push(connect.connect(window, has("ios") ? "orientationchange" : "resize", this, function (e)
                {
                    //adjustSize();
                }));

                _connectResults.push(connect.connect(dom.byId('tdNavBtnNext'), "click", function ()
                {
                    hideTextData();
                    goNextRecord();
                }));

                _connectResults.push(connect.connect(dom.byId('tdNavBtnTray'), "click", function ()
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

                _connectResults.push(connect.connect(dom.byId('tdNavBtnScreenshot'), "click", function ()
                {
                    hideTextData();
                }));

                _connectResults.push(connect.connect(dom.byId('tdNavBtnPrevious'), "click", function ()
                {
                    hideTextData();
                    goPreviousRecord();
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

                _connectResults.push(connect.connect(dom.byId('tdAddCommentImg'), "click", function ()
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
                            annoUtil.showToastMessage("You must unflag the annotation up.");
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

                _connectResults.push(connect.connect(dom.byId('imgSocialSharing'), "click", function ()
                {
                    doSocialShare();
                }));

                _connectResults.push(connect.connect(dom.byId('addCommentTextBox'), "focus", function ()
                {
                    //domStyle.set('addCommentTextBox', {position:'relative', bottom:'340px'});
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
                _connectResults.push(connect.connect(dom.byId("gfxCanvasContainer"), "click", function (e)
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

                        domStyle.set('trayBottomBarSpin', 'backgroundColor', annoUtil.level1Color);
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

                dom.byId("imgDetailScreenshot").onload = screenshotImageOnload;
                dom.byId("imgDetailScreenshot").onerror = screenshotImageOnerror;
                domStyle.set('modelApp_detail','backgroundColor', '#333333');

                // create surface
                surface = new Surface({
                    container: dom.byId("gfxCanvasContainer"),
                    width:500,
                    height:500,
                    editable:false,
                    borderWidth:0
                });
            },
            afterActivate: function()
            {
                goingNextRecord = null;
                loadingDetailData = false;
                loadingImage = false;

                var cursor = this.params["cursor"];
                if (this.params["cursor"] != null)
                {
                    var source = this.params["source"];
                    if (source == "mystuff")
                    {
                        eventsModel = this.loadedModels.mystuff;
                        registry.byId("mvcGroupDetail").set('target',at(this.loadedModels.mystuff, 'cursor'));
                    }
                    else
                    {
                        eventsModel = this.loadedModels.events;
                        registry.byId("mvcGroupDetail").set('target',at(this.loadedModels.events, 'cursor'));
                    }

                    window.setTimeout(function(){
                        loadDetailData(cursor);
                    }, 50);
                }
                adjustSize();

                textDataAreaShown = false;
                domStyle.set("headingDetail", "display", '');
                domClass.add("navBtnScreenshot", "barIconHighlight");
                domClass.remove("navBtnTray", "barIconHighlight");
            },
            beforeDeactivate: function()
            {
                domStyle.set('textDataAreaContainer', 'display', 'none');
                domStyle.set("lightCoverScreenshot", "display", 'none');

                domStyle.set("imgDetailScreenshot", "opacity", '1');

                annoUtil.hideLoadingIndicator();

                surface.clear();
                surface.hide();
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