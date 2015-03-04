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
    "dojo/touch",
    "dijit/registry",
    "dojox/css3/transit",
    "dojo/store/Memory",
    "dojox/mvc/getStateful",
    "dojox/mvc/at",
    "anno/draw/Surface",
    "anno/common/Util",
    "anno/common/OAuthUtil"
],
    function (arrayUtil, baseFX, dom, domClass, domGeom, domStyle, dojoJson, query, lang, connect, win, has, sniff, touch, registry, transit, Memory, getStateful, at, Surface, annoUtil, OAuthUtil)
    {
        var _connectResults = [],
            eventsModel = null,
            currentIndex = 0,
            scrollAnimateHandle = null,
            loadingIndicator = null;
        var app = null,
            savingVote = false,
            savingFlag = false,
            showAnnotations = true,
            localScreenshotPath = "",
            screenshotMargin = 0;
        var annoTooltipY,
            goingNextRecord = null,
            goingTagSearch = false,
            loadingDetailData = false,
            loadingImage = false,
            deletingData = false,
            trayBarHeight = 30,
            navBarHeight,
            screenshotControlsHeight,
            borderWidth = annoUtil.annotationWidth,
            zoomBorderWidth = annoUtil.annotationWidth;
        var zoomSurface, oldSurface, zoomAnnoID;
        var imageLoaded = false,
            detailLoaded = false,
            shapeRedraw = false;

        var viewPoint = win.getBox(),
            deviceRatio = parseFloat((viewPoint.w / viewPoint.h).toFixed(2));

        var imageBaseUrl = annoUtil.getCEAPIConfig().imageServiceURL;
        var surface;
        var imageWidth, imageHeight, surfaceWidth, surfaceHeight;
        var tiniestImageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";
        var hashTagTemplate = '$1<span class="hashTag" onclick="searchAnnoByHashTag(this.innerHTML)">$2</span>';
        var commentURLTemplate = '$1<span class="commentURL" onclick="window.open(encodeURI(\'$2\'), \'_blank\', \'location=no\')">$2</span>';

        // DOM objects
        var domAddCommentTextBox,
            domScreenshotContainerDetail,
            domImgDetailScreenshot;

        var _init = function() {
            navBarHeight = domStyle.get("headingDetail", "height");
            screenshotControlsHeight = domStyle.get("tbl_screenshotControls", "height");

            domAddCommentTextBox = dom.byId('addCommentTextBox');
            domScreenshotContainerDetail = dom.byId('screenshotContainerDetail');
            domImgDetailScreenshot = dom.byId('imgDetailScreenshot');
        };

        var adjustSize = function() {
            domStyle.set("appNameTextBox", "width", (viewPoint.w - 30 - 6 - 10 - 40) + "px");
            domStyle.set("lightCover", { "width" : (viewPoint.w) + "px", "height" : (viewPoint.h) + 'px' });
        };

        var screenshotImageOnload = function() {
            console.log("screenshot loaded.");
            if (!loadingDetailData) {
                annoUtil.hideLoadingIndicator();
            }

            loadingImage = false;
            imageLoaded = true;
            annoTooltipY = null;

            window.setTimeout(function() {
                var naturalImageWidth = domImgDetailScreenshot.naturalWidth,
                    naturalImageHeight = domImgDetailScreenshot.naturalHeight,
                    originalRatio = naturalImageWidth / naturalImageHeight,
                    originalDeviceRatio = parseFloat(originalRatio.toFixed(2));

                if ((originalDeviceRatio == deviceRatio) || (originalDeviceRatio < deviceRatio)) {
                    imageHeight = viewPoint.h - (navBarHeight + screenshotControlsHeight + (2 * borderWidth));
                    imageWidth = Math.round(imageHeight / (1 / originalRatio));
                } else {
                    imageWidth = viewPoint.w;
                    imageHeight = Math.round((imageWidth - (2 * borderWidth)) / originalRatio);
                }

                domStyle.set('imgDetailScreenshot', { width : '100%', height : '100%' });
                surfaceWidth = imageWidth - (2 * borderWidth);
                surfaceHeight = imageHeight;
                applyAnnoLevelColor(eventsModel.cursor.level);

                adjustNavBarZIndex();
                setControlsState();

                if (goingNextRecord != null) {
                    if (goingNextRecord) {
                        transit(null, domScreenshotContainerDetail, {
                            transition : "slide",
                            duration : 600
                        }).then(redrawShapes);
                    } else {
                        transit(null, domScreenshotContainerDetail, {
                            transition : "slide",
                            duration : 600,
                            reverse : true
                        }).then(redrawShapes);
                    }
                } else {
                    redrawShapes();
                }

                domStyle.set("AnnoScreenshotLoading", "display", "none");
                domStyle.set("AnnoScreenshot", "display", "");
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
            // don't draw annotations when imageWidth or imageHeight is undefined or zero
        	if (!imageWidth || !imageHeight) return;

        	// don't draw annotations when imgDetailScreenshot's src is tiniestImageData
            if (domImgDetailScreenshot.src === tiniestImageData) return;

            if (!imageLoaded && !detailLoaded && shapeRedraw) return;
            shapeRedraw = true;

        	var drawElements = eventsModel.cursor.draw_elements;
            var lineStrokeStyle = {
                color : eventsModel.cursor.level == 1 ? annoUtil.level1Color : annoUtil.level2Color,
                width : annoUtil.annotationWidth
            };
            var arrowHeadFillStyle = eventsModel.cursor.level == 1 ? annoUtil.level1Color : annoUtil.level2Color;
            if (drawElements)
            {
                var elementsObject = dojoJson.parse(drawElements);

                surface.show();
                if (!showAnnotations)
                {
                    toggleAnnotations();
                }

                domStyle.set(surface.container, {'border': borderWidth+'px solid transparent', top:(-borderWidth)+'px', left:(-borderWidth)+'px'});
                surface.borderWidth = borderWidth;
                surface.setDimensions(surfaceWidth, surfaceHeight);

                surface.parse(elementsObject, lineStrokeStyle, arrowHeadFillStyle);

                console.log('redrawShapes end');
            }
            else
            {
                domStyle.set(surface.container, {'border': borderWidth+'px solid transparent'});

                surface.borderWidth = borderWidth;
                surface.setDimensions(surfaceWidth, surfaceHeight);

                surface.clear();
                surface.show();

                // var earLow = !eventsModel.cursor.simple_circle_on_top;
                var earLow = true;

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
                eventsModel.set("cursorIndex", idx);
                currentIndex = idx;

                setControlsState();
                adjustAnnoCommentSize();
            }
        };

        var setControlsState = function()
        {
            var idx = currentIndex;
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

            if (eventsModel.cursor)
            {
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

                if (("author_image_url" in eventsModel.cursor) &&
                    (eventsModel.cursor.author_image_url !== "") &&
                    (annoUtil.isPlugin)) {
                    domStyle.set('defaultAuthorImage', 'display', 'none');
                    domStyle.set('authorImage', 'display', 'inline-block');
                }
            }


            if (loadingDetailData||loadingImage||deletingData)
            {
                domClass.add('td_shtCtrl_hideAnnotations', 'barIconDisabled');
                domClass.add('td_shtCtrl_edit', 'barIconDisabled');
                domClass.add('td_shtCtrl_remove', 'barIconDisabled');
            }
            else
            {
                domClass.remove('td_shtCtrl_hideAnnotations', 'barIconDisabled');
                domClass.remove('td_shtCtrl_edit', 'barIconDisabled');
                domClass.remove('td_shtCtrl_remove', 'barIconDisabled');

                if (creatorIsMe())
                {
                    domStyle.set('td_shtCtrl_edit', 'display', '');
                    domStyle.set('td_shtCtrl_remove', 'display', '');
                    domStyle.set('td_shtCtrl_hideAnnotations', 'text-align', 'left');
                }
                else
                {
                    domStyle.set('td_shtCtrl_edit', 'display', 'none');
                    domStyle.set('td_shtCtrl_remove', 'display', 'none');
                    domStyle.set('td_shtCtrl_hideAnnotations', 'text-align', 'center');
                }
            }
        };

        var creatorIsMe = function() {
            if (!eventsModel.cursor) return false;

            var creator = eventsModel.cursor.author;
            var currentUserInfo = annoUtil.getCurrentUserInfo();

            if (creator == currentUserInfo.userid ||
                creator == currentUserInfo.email ||
                creator == currentUserInfo.nickname ||
                creator == annoUtil.pluginUserEmail) {
                return true;
            }

            return false;
        };

        var applyAnnoLevelColor = function(level)
        {
            var borderColor = annoUtil.level1Color;

            level = level || 1;
            if (level == 2) {
                borderColor = annoUtil.level2Color;
            }

            domStyle.set('screenshotContainerDetail', {
                'width' : surfaceWidth + 'px',
                'height' : surfaceHeight + 'px',
                'borderColor' : borderColor,
                'borderStyle' : 'solid',
                'borderWidth' : borderWidth + 'px'
            });
        };

        var adjustAnnoCommentSize = function()
        {
        };

        var adjustNavBarZIndex = function()
        {

        };

        var resetDetailPage = function() {
            surface.clear();
            surface.hide();
            domStyle.set('modelApp_detail', 'scrollTop', '0px');
            domStyle.set('addCommentContainer', 'display', 'none');
            domAddCommentTextBox.blur();
            domAddCommentTextBox.value = '';
            imageLoaded = false;
            detailLoaded = false;
            shapeRedraw = false;
        };

        var goNextRecord = function() {
            if ((currentIndex + 1) < eventsModel.model.length) {
                resetDetailPage();
                window.setTimeout(function() {
                    loadDetailData(currentIndex + 1);
                    goingNextRecord = true;
                    annoRead(null, null, true, true);
                }, 50);
                return true;
            }

            return false;
        };

        var goPreviousRecord = function() {
            if ((currentIndex - 1) >= 0) {
                resetDetailPage();
                window.setTimeout(function() {
                    loadDetailData(currentIndex - 1);
                    goingNextRecord = false;
                    annoRead(null, null, true, false);
                }, 50);
                return true;
            }

            return false;
        };

        var handleBackButton = function() {
            var zoomData = dom.byId('zoomScreenshotContainerDetail'),
                dlg = registry.byId('dlg_common_confirm_message');

            if (zoomData && (zoomData.style.display == '' || zoomData.style.display == 'block')) {
                // Analytics
                annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'zoom close', 'android back');
                zoomClose();
                return;
            }

            if (dlg && (dlg.domNode.style.display == '' || dlg.domNode.style.display == 'block')) {
                dlg.hide();
            } else {
                // Analytics
                annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'android back button');
                app.setBackwardFired(true);
                history.back();
                resetDetailPage();
            }
        };

        var scrollToScreenshot = function()
        {
            var detailContentContainer = dom.byId('detailContentContainer_middle');

            if (scrollAnimateHandle)
            {
                connect.disconnect(scrollAnimateHandle);
            }

            if (detailContentContainer.scrollTop <=0)
            {
                return;
            }

            detailContentContainer.style.webkitTransition = "all 0ms ease";
            var st = detailContentContainer.scrollTop;
            detailContentContainer.scrollTop = 0;
            detailContentContainer.style.WebkitTransform = "translateY(-"+st+"px)";

            window.setTimeout(function(){
                scrollAnimateHandle = connect.connect(detailContentContainer, "webkitTransitionEnd", function ()
                {
                    detailContentContainer.scrollTop = 0;
                    detailContentContainer.style.webkitTransition = "none";
                    detailContentContainer.style.WebkitTransform = "none";

                    setAddCommentContainerState();
                    setScreenshotTalkAreaState();
                });

                detailContentContainer.style.webkitTransition = "all 600ms ease";
                detailContentContainer.style.WebkitTransform = "translateY(0px)";

            }, 5);
        };

        var scrollToTalkArea = function()
        {
            var detailContentContainer = dom.byId('detailContentContainer_middle');

            if (scrollAnimateHandle)
            {
                connect.disconnect(scrollAnimateHandle);
            }

            scrollAnimateHandle = connect.connect(detailContentContainer, "webkitTransitionEnd", function ()
            {
                detailContentContainer.scrollTop = imageHeight+44;
                detailContentContainer.style.webkitTransition = "all 0ms ease";
                detailContentContainer.style.WebkitTransform = "none";

                setAddCommentContainerState();
            });

            domStyle.set('addCommentContainer', 'display', 'none');
            detailContentContainer.style.webkitTransition = "all 600ms ease";
            var st = imageHeight+44-detailContentContainer.scrollTop;
            var max = detailContentContainer.scrollHeight-detailContentContainer.clientHeight-detailContentContainer.scrollTop;
            if (st > max) st = max;

            detailContentContainer.style.WebkitTransform = "translateY(-"+(st)+"px)";
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

            var APIConfig = {
                name: annoUtil.API.anno,
                method: "anno.anno.merge",
                parameter: {id:id, app_name:newAppName},
                needAuth: true,
                success: function(data)
                {
                    var currentAnno = eventsModel.cursor;
                    currentAnno.set('app', newAppName);

                    dom.byId('hiddenBtn').focus();

                    domStyle.set('appNameSpanDetail', 'display', '');
                    domStyle.set('appNameTextBox', {display: 'none'});
                    domStyle.set('lightCover', 'display', 'none');
                    domStyle.set('editAppNameImg', 'display', '');
                },
                error: function()
                {
                    dom.byId('hiddenBtn').focus();

                    domStyle.set('appNameSpanDetail', 'display', '');
                    domStyle.set('appNameTextBox', {display: 'none'});
                    domStyle.set('lightCover', 'display', 'none');
                    domStyle.set('editAppNameImg', 'display', '');
                }
            };

            annoUtil.callGAEAPI(APIConfig);
        };

        var showLocalAnno = function()
        {
            var currentAnno = eventsModel.cursor;
            domImgDetailScreenshot.src = localScreenshotPath + "/" + currentAnno.screenshot_key;
        };

        /**
         * Make detail screenshot as null.
         * For this, setting src of imgDetailScreenshot as tiniestImageData
         * and clearing all annotations.
         */
        var setDetailScreenshotNull = function() {
            surface.clear();
            surface.hide();
            domImgDetailScreenshot.src = tiniestImageData;
        };

        var loadDetailData = function(cursor)
        {
            if (loadingDetailData||loadingImage) return;

            domStyle.set("AnnoScreenshotLoading", "display", "");
            domStyle.set("AnnoScreenshot", "display", "none");
            domStyle.set("AnnoDetails", "display", "none");

            loadingDetailData = true;
            setControlsState();

            var previousAnno = eventsModel.cursor||eventsModel.model[0];

            if (previousAnno) {
                // showing tiniest gif image instead of empty image data
                domImgDetailScreenshot.src = tiniestImageData;
            }

            eventsModel.set("cursorIndex", cursor);
            processAnnoTextHashTags();

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

            var annoImage = imageBaseUrl + "?anno_id=" + id;
            domImgDetailScreenshot.src = annoImage;
            console.log("image url: " + annoImage);

            var APIConfig = {
                name: annoUtil.API.anno,
                method: "anno.anno.get",
                parameter: { id:id, team_key:annoUtil.pluginTeamKey },
                needAuth: true,
                success: function(data)
                {
                    // console.error(JSON.stringify(data.result));
                    var currentAnno = eventsModel.cursor||eventsModel.model[0], returnAnno = data.result, deviceInfo = '';

                    // currentAnno.set('circleX', parseInt(returnAnno.simple_x, 10));
                    // currentAnno.set('circleY', parseInt(returnAnno.simple_y, 10));
                    currentAnno.set('circleX', 0);
                    currentAnno.set('circleY', 0);

                    if (returnAnno.followup_list)
                    {
                        for (var j=0;j<returnAnno.followup_list.length;j++)
                        {
                            returnAnno.followup_list[j].user_id = returnAnno.followup_list[j].creator.display_name || returnAnno.followup_list[j].creator.user_email || returnAnno.followup_list[j].creator.id;
                            returnAnno.followup_list[j].user_image = returnAnno.followup_list[j].creator.image_url || "";
                            returnAnno.followup_list[j].timestamp = annoUtil.getTimeAgoString(returnAnno.followup_list[j].created);
                            returnAnno.followup_list[j].default_commenter_image = "";
                            returnAnno.followup_list[j].commenter_image = "hidden";

                            if ((returnAnno.followup_list[j].user_image !== "") && (annoUtil.isPlugin)) {
                                returnAnno.followup_list[j].default_commenter_image = "hidden";
                                returnAnno.followup_list[j].commenter_image = "";
                            }

                            processFollowupHashTagsOrURLs(returnAnno.followup_list[j]);
                        }
                    }

                    currentAnno.set('comments', new getStateful(returnAnno.followup_list || []));

                    device_model = annoUtil.parseDeviceModel(returnAnno.device_model) || ' ';
                    os_name = returnAnno.os_name || ' ';
                    os_version = returnAnno.os_version || ' ';
                    deviceInfo = device_model + ' / ' + os_name + ' ' + os_version;
                    currentAnno.set('deviceInfo', deviceInfo);

                    currentAnno.set('vote', returnAnno.is_my_vote);
                    currentAnno.set('flag', returnAnno.is_my_flag);
                    currentAnno.set('level', returnAnno.level);
                    currentAnno.set('draw_elements', returnAnno.draw_elements||"");

                    loadingDetailData = false;
                    detailLoaded = true;

                    if (!loadingImage)
                    {
                        annoUtil.hideLoadingIndicator();
                        redrawShapes();
                    }

                    setDetailsContext(cursor);
                    domStyle.set("AnnoDetails", "display", "");
                    annoUtil.getEngagedUsersForAnno(id);
                },
                error: function()
                {
                    loadingDetailData = false;
                }
            };

            annoUtil.callGAEAPI(APIConfig);
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

            var APIConfig = {
                name: annoUtil.API.followUp,
                method: "followup.followup.insert",
                parameter: {
                    anno_id : id,
                    comment : annoUtil.replaceUniqueUserNameWithID(comment),
                    tagged_users : annoUtil.taggedUserIDs,
                    team_key : annoUtil.pluginTeamKey
                },
                needAuth: true,
                success: function(data)
                {
                    var currentAnno = eventsModel.cursor||eventsModel.model[0];
                    // sync commented activity
                    currentAnno.lastActivityChangedClass = "icon-comment";
                    currentAnno.lastActivityText = "commented";
                    currentAnno.when = new Date().getTime();

                    default_commenter_image = "";
                    commenter_image = "hidden";
                    if ((annoUtil.pluginUserImageURL !== "") && (annoUtil.isPlugin)) {
                        default_commenter_image = "hidden";
                        commenter_image = "";
                    }

                    var commentObject = {
                        user_id : data.creator.display_name,
                        comment : data.comment,
                        user_image : data.creator.image_url,
                        default_commenter_image : default_commenter_image,
                        commenter_image : commenter_image,
                        tagged_users_detail : data.tagged_users_detail
                    };
                    processFollowupHashTagsOrURLs(commentObject);
                    // currentAnno.comments.splice(0, 0, new getStateful(commentObject));
                    currentAnno.comments.push(new getStateful(commentObject));
                    adjustAnnoCommentSize();
                    annoUtil.resetTextSuggestion("detailSuggestedTags");
                },
                error: function(){
                }
            };

            annoUtil.callGAEAPI(APIConfig);
            // Analytics
            annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'submit comment');
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

            var APIConfig = {
                name: annoUtil.API.vote,
                method: action == "add_vote"?"vote.vote.insert":"vote.vote.delete",
                parameter: {anno_id:id},
                needAuth: true,
                success: function(data)
                {
                    console.log(JSON.stringify(data.result));

                    if (action == "remove_vote")
                    {
                        domClass.remove('imgThumbsUp', 'icoImgActive');
                    }
                    else
                    {
                        domClass.add('imgThumbsUp', 'icoImgActive');
                        // sync voted-up activity, TODO: should sync un-vote activity
                        eventsModel.cursor.lastActivityChangedClass = "icon-thumbs-up";
                        eventsModel.cursor.lastActivityText = "upvoted";
                        eventsModel.cursor.when = Date.now();
                    }

                    savingVote = false;
                },
                error: function()
                {
                    savingVote = false;
                }
            };

            annoUtil.callGAEAPI(APIConfig);
            // Analytics
            annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'save vote', action == "add_vote"? "insert": "delete");
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

            var APIConfig = {
                name: annoUtil.API.flag,
                method: action == "add_flag"?"flag.flag.insert":"flag.flag.delete",
                parameter: {anno_id:id},
                needAuth: true,
                success: function(data)
                {
                    console.log(JSON.stringify(data.result));

                    if (action == "remove_flag")
                    {
                        domClass.remove('imgFlag', 'icoImgActive');
                    }
                    else
                    {
                        domClass.add('imgFlag', 'icoImgActive');
                        // sync flagged activity, TODO: should sync un-flag activity
                        eventsModel.cursor.lastActivityChangedClass = "icon-flag";
                        eventsModel.cursor.lastActivityText = "flagged";
                        eventsModel.cursor.when = Date.now();
                    }
                    savingFlag = false;
                },
                error: function()
                {
                    savingFlag = false;
                }
            };

            annoUtil.callGAEAPI(APIConfig);
            // Analytics
            annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'save flag', action !== "remove"? "insert": "delete");
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
            // Analytics
            annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'share via');
        };

        // screenshot controls
        var toggleAnnotations = function()
        {
            if (showAnnotations)
            {
                showAnnotations = false;
                dom.byId('td_shtCtrl_hideAnnotations').children[0].innerHTML = "Show Annotations";
                surface.hide();
            }
            else
            {
                showAnnotations = true;
                dom.byId('td_shtCtrl_hideAnnotations').children[0].innerHTML = "Hide Annotations";
                surface.show();
            }
            // Analytics
            annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'toggle annotations', showAnnotations? 'on': 'off');
        };

        var setScreenshotTalkAreaState = function()
        {
            var screenshotVisible = isScreenshotVisible();
            if (screenshotVisible)
            {
                domClass.remove('navBtnScreenshot', 'barIconDisabled');
            }
            else
            {
                domClass.add('navBtnScreenshot', 'barIconDisabled');
            }

            if (isBottomPlaceHolderVisible()||!screenshotVisible)
            {
                domClass.remove('navBtnTray', 'barIconDisabled');
                domClass.add('navBtnTray', 'barIconHighlight');
            }
            else
            {
                domClass.add('navBtnTray', 'barIconDisabled');
                domClass.remove('navBtnTray', 'barIconHighlight');
            }
        };

        var isVoteFlagContainerVisible = function()
        {
            var pos = domGeom.position(dom.byId('voteFlagContainer'));
            // var viewPoint = win.getBox();

            if ((pos.y + 50) <= viewPoint.h)
            {
                return true;
            }

            return false;
        };

        var isBottomPlaceHolderVisible = function()
        {
            var pos = domGeom.position(dom.byId('detailBottomPlaceholder'));
            // var viewPoint = win.getBox();

            if ((pos.y + 50) <= viewPoint.h)
            {
                return true;
            }

            return false;
        };

        var isScreenshotVisible = function()
        {
            var pos = domGeom.position(domScreenshotContainerDetail);

            if (pos.y >=0) return true;

            if (Math.abs(pos.y) >= pos.h)
            {
                return false;
            }

            if ((Math.abs(pos.y)+50) <= pos.h)
            {
                return true;
            }

            return false;
        };

        var setAddCommentContainerState = function()
        {
            if (isVoteFlagContainerVisible())
            {
                domStyle.set('addCommentContainer', 'display', '');
            }
            else
            {
                domStyle.set('addCommentContainer', 'display', 'none');
            }
        };

        var editAnnoItem = function()
        {
            clearEditRelatedStorage();
            var annoItem = eventsModel.cursor;
            var imageData = outputImage();

            saveCurrentAnnoDataforEdit(annoItem, imageData);

            var landscapeMode = false;
            if (domImgDetailScreenshot.naturalWidth > domImgDetailScreenshot.naturalHeight) {
                landscapeMode = true;
            }

            cordova.exec(
                function (result)
                {
                },
                function (err)
                {
                },
                "AnnoCordovaPlugin",
                'start_edit_anno_draw',
                [landscapeMode]
            );

            checkEditAnnoResult();

            // Analytics
            annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'edit item');
        };

        var saveCurrentAnnoDataforEdit = function(annoItem, imageData)
        {
            var annoData = {
                id: annoItem.id,
                app: annoItem.app,
                appVersion: annoItem.appVersion,
                level: annoItem.level,
                draw_elements: annoItem.draw_elements
            };

            window.localStorage.setItem(annoUtil.localStorageKeys.currentAnnoData, dojoJson.stringify(annoData));
            window.localStorage.setItem(annoUtil.localStorageKeys.currentImageData, imageData);
        };

        var checkEditAnnoResult = function()
        {
            var editResult = window.localStorage.getItem(annoUtil.localStorageKeys.editAnnoDone);

            if (editResult)
            {
                console.log("checkEditAnnoResult: "+editResult);

                if (editResult == "done")
                {
                    console.log(window.localStorage.getItem(annoUtil.localStorageKeys.updatedAnnoData));
                    var updatedAnnoData = dojoJson.parse(window.localStorage.getItem(annoUtil.localStorageKeys.updatedAnnoData));
                    var currentAnno = eventsModel.cursor;

                    currentAnno.set('app', updatedAnnoData.appName);
                    currentAnno.set('appVersion', updatedAnnoData.appVersion);
                    currentAnno.set('annoText', updatedAnnoData.comment);
                    currentAnno.set('hashTaggedAnnoText', "");
                    processAnnoTextHashTags();
                    currentAnno.set('draw_elements', updatedAnnoData.draw_elements);

                    if (updatedAnnoData.image)
                    {
                        domImgDetailScreenshot.src = updatedAnnoData.image;
                    }

                    redrawShapes();

                    // sync edited activity
                    currentAnno.lastActivityChangedClass = "icon-pencil";
                    currentAnno.lastActivityText = "edited";
                    currentAnno.when = new Date().getTime();
                }
            }
            else
            {
                window.setTimeout(checkEditAnnoResult, 500);
            }
        };

        var clearEditRelatedStorage = function()
        {
            window.localStorage.removeItem(annoUtil.localStorageKeys.editAnnoDone);
            window.localStorage.removeItem(annoUtil.localStorageKeys.updatedAnnoData);
        };

        var outputImage = function()
        {
            var hiddenCanvas = dom.byId('backgroundCanvas');
            hiddenCanvas.width = domImgDetailScreenshot.naturalWidth;
            hiddenCanvas.height = domImgDetailScreenshot.naturalHeight;
            var ctx = hiddenCanvas.getContext('2d');
            ctx.drawImage(domImgDetailScreenshot, 0, 0, domImgDetailScreenshot.naturalWidth, domImgDetailScreenshot.naturalHeight);

            var dataUrl = hiddenCanvas.toDataURL("image/png");
            return dataUrl;
        };

        var deleteAnnoItem = function()
        {
            var annoId = eventsModel.cursor.id;
            deletingData = true;
            setControlsState();
            console.log("start delete anno.");

            var APIConfig = {
                name: annoUtil.API.anno,
                method: "anno.anno.delete",
                parameter: {id:annoId},
                needAuth: true,
                success: function(data)
                {
                    console.log("anno deleted.");
                    deletingData = false;
                    annoUtil.hideLoadingIndicator();

                    eventsModel.model.splice(currentIndex, 1);

                    if (eventsModel.model.length <=0)
                    {
                        // no available records, go back.
                        history.back();
                    }
                    else if (currentIndex < eventsModel.model.length)
                    {
                        loadDetailData(currentIndex);
                    }
                    else
                    {
                        if (!goNextRecord())
                        {
                            goPreviousRecord();
                        }
                    }
                },
                error: function()
                {
                    deletingData = false;
                    setControlsState();
                }
            };

            annoUtil.callGAEAPI(APIConfig);

            // Analytics
            annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'delete item');
        };

        // hash tags
        var processAnnoTextHashTags = function()
        {
            // hash tags are replaced already
            if (eventsModel.cursor.hashTaggedAnnoText)
            {
                return;
            }

            var annoText = eventsModel.cursor.annoText;
            eventsModel.cursor.set('hashTaggedAnnoText', annoUtil.replaceHashTagWithLink(annoText, hashTagTemplate));
        };

        var processFollowupHashTagsOrURLs = function(followup)
        {
        	// hash tags are replaced already then don't replace
        	if (!followup.modifiedComment)
        	{
        		followup.modifiedComment = followup.comment;
        		followup.modifiedComment = annoUtil.replaceHashTagWithLink(followup.modifiedComment, hashTagTemplate);
        		followup.modifiedComment = annoUtil.replaceURLWithLink(followup.modifiedComment, commentURLTemplate);
                followup.modifiedComment = annoUtil.replaceEmailWithName(followup.modifiedComment, followup.tagged_users_detail);
        	}
        };

        // search anno items by hash tag
        var searchAnnoByHashTag = window.searchAnnoByHashTag = function(tag) {
            if (annoUtil.isPlugin) return;
            goingTagSearch = true;
            app.transitionToView(document.getElementById('modelApp_detail'), {
                target : 'searchAnno',
                url : '#searchAnno',
                params : { tag : tag }
            });
        };

        var zoomImage = function(zoomFactor) {
            var zoomImgDetailScreenshot = dom.byId('zoomImgDetailScreenshot'),
                zoomImgDetailScreenshotWidth = zoomImgDetailScreenshot.naturalWidth,
                zoomImgDetailScreenshotHeight = zoomImgDetailScreenshot.naturalHeight;

            var zoomFactor = zoomFactor || 1,
                currentAnno = eventsModel.cursor,
                zoomImageWidth,
                zoomImageHeight;

            if (zoomImgDetailScreenshotWidth > zoomImgDetailScreenshotHeight) {
                zoomImageHeight = (viewPoint.h - (2 * zoomBorderWidth)) * zoomFactor;
                zoomImageWidth = Math.round(zoomImageHeight / (zoomImgDetailScreenshotHeight / zoomImgDetailScreenshotWidth));
            } else {
                zoomImageWidth = (viewPoint.w - (2 * zoomBorderWidth)) * zoomFactor;
                zoomImageHeight = Math.round(zoomImageWidth / (zoomImgDetailScreenshotWidth / zoomImgDetailScreenshotHeight));
            }

            var borderColor = annoUtil.level1Color,
                level = currentAnno.level || 1;

            if (level == 2) {
                borderColor = annoUtil.level2Color;
            }

            domStyle.set('zoomImgDetailScreenshot', {
                width : zoomImageWidth + "px",
                height : zoomImageHeight + "px",
                borderColor : borderColor,
                borderStyle : 'solid',
                borderWidth : zoomBorderWidth + "px"
            });

            domStyle.set('zoomGfxCanvasContainer', {
                width : (zoomImageWidth + zoomBorderWidth) + "px",
                height : (zoomImageHeight + zoomBorderWidth) + "px"
            });

            domStyle.set('zoomClose', 'color', borderColor);

            imageWidth = zoomImageWidth;
            imageHeight = zoomImageHeight;
            surfaceWidth = zoomImageWidth + zoomBorderWidth;
            surfaceHeight = zoomImageHeight + zoomBorderWidth;
            borderWidth = zoomBorderWidth;

            if (zoomFactor == 1) {
                oldSurface = surface;
                surface = zoomSurface;
                surface.registry = {};

                dom.byId('zoomScreenshotContainerDetail').scrollLeft = 0;
                dom.byId('zoomScreenshotContainerDetail').scrollTop = 0;
            }

            redrawShapes();
            annoUtil.hideLoadingIndicator();

            domStyle.set('zoomScreenshotContainerDetail', 'display', '');
            domStyle.set('headingDetail', 'display', 'none');
            domStyle.set('detailContentContainer', 'display', 'none');

            // disable native gesture to scroll horizontal properly
            annoUtil.disableNativeGesture();

            // Analytics
            annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'zoom detail', '', zoomFactor);
        };

        var zoomClose = function() {
            surface.clear();
            surface = oldSurface;
            annoUtil.hideLoadingIndicator();
            annoUtil.enableNativeGesture();

            domStyle.set('zoomScreenshotContainerDetail', 'display', 'none');
            domStyle.set('headingDetail', 'display', '');
            domStyle.set('detailContentContainer', 'display', '');
        };

        var searchAnnoByApp = function() {
            app.transitionToView(document.getElementById('modelApp_detail'), {
                target : 'searchAnno',
                url : '#searchAnno',
                params : {
                    tag : dom.byId("appNameSpanDetail").innerHTML,
                    app : dom.byId("appNameSpanDetail").innerHTML
                }
            });
        };

        var startX, startY, commentTextBoxFocused = false;
        return {
            // simple view init
            init:function ()
            {
                app = this.app;
                eventsModel = this.loadedModels.events;
                localScreenshotPath = annoUtil.getAnnoScreenshotPath();
                _init();

                domStyle.set("annoTextDetail", "border-color", annoUtil.level1Color);

                _connectResults.push(connect.connect(window, has("ios") ? "orientationchange" : "resize", this, function (e)
                {
                    //adjustSize();
                }));

                _connectResults.push(connect.connect(dom.byId('navBtnTdBackScreenshot'), 'click', function () {
                    // Analytics
                    annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'nav back button');
                    history.back();
                    resetDetailPage();
                }));

                _connectResults.push(connect.connect(dom.byId('navBtnNext'), 'click', function ()
                {
                    // Analytics
                    annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'header next arrow');

                    goNextRecord();
                }));

                _connectResults.push(connect.connect(dom.byId('navBtnTray'), 'click', function ()
                {
                    scrollToTalkArea();
                }));

                _connectResults.push(connect.connect(dom.byId('navBtnScreenshot'), 'click', function ()
                {
                    scrollToScreenshot();
                }));

                _connectResults.push(connect.connect(dom.byId('navBtnPrevious'), 'click', function ()
                {
                    // Analytics
                    annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'header prev arrow');

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

                _connectResults.push(connect.connect(dom.byId('sendComment'), 'click', function ()
                {
                    var text = domAddCommentTextBox.value.trim();

                    if (!text)
                    {
                        // alert('Please enter comment.');
                        annoUtil.showMessageDialog('Please enter comment.');
                        domAddCommentTextBox.focus();
                        return;
                    }

                    window.setTimeout(function(){
                        saveComment(text);
                    },10);

                    domAddCommentTextBox.value = '';
                    dom.byId('hiddenBtn').focus();
                }));

                _connectResults.push(connect.connect(dom.byId('imgThumbsUp'), 'click', function ()
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

                _connectResults.push(connect.connect(dom.byId('imgFlag'), 'click', function ()
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

                /*_connectResults.push(connect.connect(dom.byId('imgSocialSharing'), 'click', function ()
                {
                    doSocialShare();
                }));*/

                _connectResults.push(connect.connect(domAddCommentTextBox, "focus", function() {
                    commentTextBoxFocused = true;
                    window.setTimeout(function() {
                        domAddCommentTextBox.rows = "4";
                        domClass.add("sendComment", "expanded");
                        annoUtil.showSuggestionTools("addCommentContainer", "detailSuggestionTool");
                    }, 500);
                }));

                _connectResults.push(connect.connect(domAddCommentTextBox, "blur", function() {
                    commentTextBoxFocused = false;
                    window.setTimeout(function() {
                        domAddCommentTextBox.rows = "1";
                        domClass.remove("sendComment", "expanded");
                        domStyle.set('detailSuggestedTags', 'display', 'none');
                        annoUtil.hideSuggestionTools("addCommentContainer", "detailSuggestionTool");
                    }, 500);
                }));

                _connectResults.push(connect.connect(domAddCommentTextBox, "keydown", function(e) {
                    if (e.keyCode == 13) {
                        var text = domAddCommentTextBox.value.trim();

                        if (!text) {
                            annoUtil.showMessageDialog('Please enter comment.');
                            domAddCommentTextBox.focus();
                            return;
                        }

                        window.setTimeout(function() { saveComment(text); }, 10);
                        domAddCommentTextBox.value = '';
                        dom.byId('hiddenBtn').focus();
                    }
                }));

                _connectResults.push(connect.connect(dom.byId("suggestionToolUsers"), "click", function(e) {
                    dojo.stopEvent(e);
                    annoUtil.showTextSuggestion("detailSuggestedTags", "addCommentTextBox", 64);
                }));

                _connectResults.push(connect.connect(dom.byId("suggestionToolTags"), "click", function(e) {
                    dojo.stopEvent(e);
                    annoUtil.showTextSuggestion("detailSuggestedTags", "addCommentTextBox", 35);
                }));

                _connectResults.push(connect.connect(domAddCommentTextBox, "input", function(e) {
                    window.setTimeout(function() {
                        annoUtil.showTextSuggestion("detailSuggestedTags", "addCommentTextBox");
                    }, 0);
                }));

                _connectResults.push(connect.connect(domScreenshotContainerDetail, "touchstart", function (e)
                {
                    if( e.touches.length == 1 )
                    {
                        startX = e.touches[0].pageX;
                        startY = e.touches[0].pageY;
                    }
                }));

                _connectResults.push(connect.connect(domScreenshotContainerDetail, "touchmove", function (e)
                {
                    if (e.touches.length == 1) {
                        var endX = e.touches[0].pageX;
                        var endY = e.touches[0].pageY;
                        if ((startX - endX) >= 30 && Math.abs(startY - endY) < 10) {
                            dojo.stopEvent(e);

                            // Analytics
                            annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'swipe to next record');

                            goNextRecord();
                        } else if ((startX - endX) <= -30 && Math.abs(startY - endY) < 10) {
                            dojo.stopEvent(e);

                            // Analytics
                            annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'swipe to prev record');

                            goPreviousRecord();
                        }
                    }
                }));

                _connectResults.push(connect.connect(dom.byId('editAppNameImg'), 'click', function ()
                {
                    showAppNameTextBox();
                }));

                _connectResults.push(connect.connect(dom.byId('detailContentContainer_middle'), "scroll", function (e)
                {
                    dojo.stopEvent(e);
                    setScreenshotTalkAreaState();

                    if (!commentTextBoxFocused)
                    {
                        setAddCommentContainerState();
                    }
                }));

                // screenshot controls
                _connectResults.push(connect.connect(dom.byId('td_shtCtrl_hideAnnotations'), 'click', function ()
                {
                    if (domClass.contains('td_shtCtrl_hideAnnotations', 'barIconDisabled')) return;
                    toggleAnnotations();
                }));

                _connectResults.push(connect.connect(dom.byId('td_shtCtrl_edit'), 'click', function ()
                {
                    if (domClass.contains('td_shtCtrl_edit', 'barIconDisabled')) return;
                    editAnnoItem();
                }));

                _connectResults.push(connect.connect(dom.byId('td_shtCtrl_remove'), 'click', function ()
                {
                    if (domClass.contains('td_shtCtrl_remove', 'barIconDisabled')) return;

                    annoUtil.showConfirmMessageDialog("This will delete the item and all followup discussion. Are you sure?", function(ret){
                        if (ret)
                        {
                            deleteAnnoItem();
                        }
                    });
                }));

                _connectResults.push(connect.connect(domScreenshotContainerDetail, 'click', function(e) {
                    dojo.stopEvent(e);
                    annoUtil.showLoadingIndicator();

                    if (zoomAnnoID != eventsModel.cursor.id) {
                        dom.byId('zoomImgDetailScreenshot').src = imageBaseUrl + "?anno_id=" + eventsModel.cursor.id;
                        zoomAnnoID = eventsModel.cursor.id;
                    } else {
                        zoomImage();
                    }
                }));

                _connectResults.push(connect.connect(dom.byId('zoomScreenshotContainerDetail'), 'click', function(e) {
                    dojo.stopEvent(e);
                    zoomImage(2);
                }));

                _connectResults.push(connect.connect(dom.byId('zoomClose'), 'click', function(e) {
                    dojo.stopEvent(e);

                    // Analytics
                    annoUtil.actionGATracking(annoUtil.analytics.category.detail, 'zoom close', 'soft key');

                    zoomClose();
                }));

                _connectResults.push(connect.connect(dom.byId("appNameSpanDetail"), 'click', function(e) {
                    dojo.stopEvent(e);
                    searchAnnoByApp();
                }));

                dom.byId("imgDetailScreenshot").onload = screenshotImageOnload;
                dom.byId("imgDetailScreenshot").onerror = screenshotImageOnerror;
                dom.byId("imgDetailScreenshot").crossOrigin = "anonymous";

                dom.byId("zoomImgDetailScreenshot").onload = function() { zoomImage() };
                dom.byId("zoomImgDetailScreenshot").crossOrigin = "anonymous";

                if (annoUtil.isAndroid()) {
                    domStyle.set('zoomClose', 'display', 'none');
                }

                // create surface
                surface = new Surface({
                    container: dom.byId("gfxCanvasContainer"),
                    width:500,
                    height:500,
                    editable:false,
                    borderWidth:0
                });

                zoomSurface = new Surface({
                    container : dom.byId("zoomGfxCanvasContainer"),
                    width : 500,
                    height : 500,
                    editable : false,
                    borderWidth : 0
                });
            },
            afterActivate: function()
            {
                goingNextRecord = null;
                loadingDetailData = false;
                loadingImage = false;
                imageLoaded = false;
                detailLoaded = false;
                shapeRedraw = false;

                var cursor = this.params["cursor"];
                
                // Analytics
                annoUtil.screenGATracking(annoUtil.analytics.category.detail);
                annoUtil.actionGATracking(annoUtil.analytics.category.detail, "loaded anno", cursor);

                if (cursor != null)
                {
                    var source = this.params["source"];
                    var currentAnnoId = eventsModel.cursor?eventsModel.cursor.id:'';

                    if (source == "mystuff")
                    {
                        eventsModel = this.loadedModels.mystuff;
                        registry.byId("mvcGroupDetail").set('target',at(this.loadedModels.mystuff, 'cursor'));

                        dom.byId('detailPageName').innerHTML = "Activity";
                    }
                    else if (source == "tagSearch")
                    {
                        eventsModel = this.loadedModels.searchAnno;
                        registry.byId("mvcGroupDetail").set('target',at(this.loadedModels.searchAnno, 'cursor'));

                        dom.byId('detailPageName').innerHTML = "Search";
                    }
                    else
                    {
                        eventsModel = this.loadedModels.events;
                        registry.byId("mvcGroupDetail").set('target',at(this.loadedModels.events, 'cursor'));

                        if (this.app.inSearchMode())
                        {
                            dom.byId('detailPageName').innerHTML = "Search";
                        }
                        else
                        {
                            dom.byId('detailPageName').innerHTML = "Explore";
                        }
                    }

                    /**
                     * if user goes to this page by clicking backbutton(from searchAnno page), then check if current anno id
                     * is same to the cursor id, if true, then don't need to reload data, but need to reload the screenshot
                     */
                    if (app.isBackwardFired() && currentAnnoId == eventsModel.model[parseInt(cursor, 10)].id) {
                        // set data model cursor
                        eventsModel.set("cursorIndex", cursor);
                        if (domImgDetailScreenshot.src == tiniestImageData) {
                            // reload the screenshot
                            annoUtil.showLoadingIndicator();
                            domImgDetailScreenshot.src = imageBaseUrl + "?anno_id=" + eventsModel.cursor.id;
                        }
                    } else {
                        window.setTimeout(function() {
                            loadDetailData(cursor);
                        }, 50);
                    }
                }

                adjustSize();

                domStyle.set("headingDetail", "display", '');
                // domClass.add("navBtnScreenshot", "barIconHighlight");
                domClass.remove("navBtnTray", "barIconHighlight");
                domClass.add("navBtnTray", "barIconDisabled");

                dom.byId('detailContentContainer_middle').scrollTop = 0;
                document.addEventListener("backbutton", handleBackButton, false);

                domStyle.set("AnnoScreenshotLoading", "display", "");
                domStyle.set("AnnoScreenshot", "display", "none");
                domStyle.set("AnnoDetails", "display", "none");
            },
            beforeDeactivate: function()
            {
                domStyle.set("imgDetailScreenshot", "opacity", '1');
                annoUtil.hideLoadingIndicator();

                // calling setDetailScreenshotNull after 300ms so that imgDetailScreenshot will
                // not clear out before going back to community page
                // David Lee: if deactivate caused by clicking hash tag to go to search page, then skip this step.

                if (goingTagSearch)
                {
                    goingTagSearch = false;
                }
                else
                {
                    setTimeout(setDetailScreenshotNull, 310);
                }

                document.removeEventListener("backbutton", handleBackButton, false);
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