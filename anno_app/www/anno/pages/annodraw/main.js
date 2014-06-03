require([
    "anno/draw/Surface",
    "dojo/_base/connect",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/json",
    "dojo/query",
    "dojo/ready",
    "dojo/touch",
    "dojo/window",
    "dijit/registry",
    "anno/common/DBUtil",
    "anno/common/Util",
    "anno/common/OAuthUtil",
    "anno/anno/AnnoDataHandler",
    "dojo/domReady!"
], function (Surface, connect, dom, domClass, domGeom, domStyle, dojoJson, query, ready, touch, win, registry, DBUtil, annoUtil, OAuthUtil, AnnoDataHandler)
{
    var viewPoint,
        defaultShapeWidth = 160,
        defaultShapeHeight = 80,
        shareDialogGap = 80,
        borderWidth;

    var sdTitleHeight = 60, sdTabBarHeight = 30,
        sdBottom = 50, barHeight = 50, totalSpace = 0;

    var lastShapePos;
    var lastBlackRectanglePos;

    var surface, drawMode = false;
    var defaultCommentBox;

    var selectedAppName, screenShotPath;
    var level1Color = annoUtil.level1Color,
        level2Color = annoUtil.level2Color;
    var level = 1;
    var isAnno = false, appNameListFetched = false;
    var editMode = false, editAppName = "",
        editAnnoId = "",
        originalGrayBoxes,
        originalGrayBoxCnt = 0,
        editDrawElementsJson = "";

    connect.connect(dom.byId("barArrow"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barArrow"), 'barIconInactive')) return;

        var arrowLine = surface.createArrowLine({x1:lastShapePos.x1, y1: lastShapePos.y1, x2: lastShapePos.x2, y2: lastShapePos.y2});
        updateLastShapePos(arrowLine.shapeType);
    });

    connect.connect(dom.byId("barRectangle"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barRectangle"), 'barIconInactive')) return;

        var rectangle = surface.createRectangle({startX:lastShapePos.x1, startY: lastShapePos.y1-defaultShapeHeight-50, width: defaultShapeWidth, height: defaultShapeHeight});
        updateLastShapePos(rectangle.shapeType);
    });

    connect.connect(dom.byId("barComment"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barComment"), 'barIconInactive')) return;

        var lineStrokeStyle = {color: level==1?level1Color:level2Color, width: 3};
        var commentBox = surface.createCommentBox({startX:lastShapePos.x1, startY: lastShapePos.y1-defaultShapeHeight-50, width: defaultShapeWidth, height: defaultShapeHeight,lineStrokeStyle:lineStrokeStyle});
        updateLastShapePos('Rectangle');

        commentBox.onCommentBoxInput = checkBarShareState;
        commentBox.onCommentBoxFocus = hideBottomNavBar;
        commentBox.onCommentBoxBlur = showBottomNavBar;

        checkBarShareState();
    });

    connect.connect(dom.byId("barShare"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barShare"), 'barIconInactive')) return;

        if (editMode)
        {
            if (level == 2 || !isAnno)
            {
                updateDrawCommentAnno();
            }
            else
            {
                openShareDialog();
            }
        }
        else
        {
            if (level == 2 || !isAnno)
            {
                if (drawMode)
                {
                    insertDrawCommentAnno();
                }
                else
                {
                    insertSimpleCommentAnno();
                }
            }
            else
            {
                openShareDialog();
            }
        }
    });

    connect.connect(dom.byId("txtAppName"), 'keydown', function(e)
    {
        if (e.keyCode == 13)
        {
            dom.byId("hiddenBtn").focus();
            dom.byId("hiddenBtn").click();
        }
    });

    connect.connect(dom.byId("barBlackRectangle"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barBlackRectangle"), 'barIconInactive')) return;

        createBlackRectangle();
    });

    // handle app name list click event
    connect.connect(dom.byId("sdAppList"), 'click', function(e)
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

            if (allItems[i].children[0].tagName == "INPUT")
            {
                domStyle.set(allItems[i].children[0], "color", "gray");
            }
        }

        domClass.remove(itemNode, 'appNameItem-gray');

        if (itemNode.children[0].tagName == "INPUT")
        {
            domStyle.set(itemNode.children[0], "color", "white");
            selectedAppName = itemNode.children[0].innerHTML;
        }
        else
        {
            selectedAppName = itemNode.children[0].innerHTML;
        }
    });

    // share button
    connect.connect(dom.byId("btnShare"), 'click', function(e)
    {
        registry.byId('shareDialog').hide();
        // enable JS gesture listener, disable native gesture
        annoUtil.enableJSGesture();
        annoUtil.disableNativeGesture();

        if (editMode)
        {
            updateDrawCommentAnno();
        }
        else
        {
            if (drawMode)
            {
                insertDrawCommentAnno();
            }
            else
            {
                insertSimpleCommentAnno();
            }
        }

    });

    // home/feeds/cancel button
    connect.connect(dom.byId("menuItemFeed"), 'click', function(e)
    {
        var action = "goto_anno_home";

        window.localStorage.setItem(annoUtil.localStorageKeys.editAnnoDone, "cancel");

        cordova.exec(
            function (result)
            {

            },
            function (err)
            {
                // alert(err.message);
                annoUtil.showMessageDialog(err.message);
            },
            "AnnoCordovaPlugin",
            action,
            []
        );
    });

    connect.connect(dom.byId("menuItemCancel"), 'click', function(e)
    {
        var action = "exit_current_activity";
        window.localStorage.setItem(annoUtil.localStorageKeys.editAnnoDone, "cancel");

        cordova.exec(
            function (result)
            {

            },
            function (err)
            {
                // alert(err.message);
                annoUtil.showMessageDialog(err.message);
            },
            "AnnoCordovaPlugin",
            action,
            []
        );
    });

    // app tabs
    connect.connect(dom.byId("barRecentApps"), 'click', function(e)
    {
        if (domClass.contains(dom.byId('barRecentApps').parentNode, 'active'))
        {
            return;
        }

        domClass.add(dom.byId('barRecentApps').parentNode, 'active');
        domClass.remove(dom.byId('barAllApps').parentNode);
        domClass.remove(dom.byId('barElseApps').parentNode);

        domStyle.set('sdAllAppsListContent', 'display', 'none');
        domStyle.set('sdElseAppListContent', 'display', 'none');
        domStyle.set('sdRecentAppsListContent', 'display', '');
    });

    connect.connect(dom.byId("barAllApps"), 'click', function(e)
    {
        if (domClass.contains(dom.byId('barAllApps').parentNode, 'active'))
        {
            return;
        }

        domClass.add(dom.byId('barAllApps').parentNode, 'active');
        domClass.remove(dom.byId('barRecentApps').parentNode);
        domClass.remove(dom.byId('barElseApps').parentNode);

        domStyle.set('sdRecentAppsListContent', 'display', 'none');
        domStyle.set('sdElseAppListContent', 'display', 'none');
        domStyle.set('sdAllAppsListContent', 'display', '');
    });

    connect.connect(dom.byId("barElseApps"), 'click', function(e)
    {
        if (domClass.contains(dom.byId('barElseApps').parentNode, 'active'))
        {
            return;
        }

        domClass.add(dom.byId('barElseApps').parentNode, 'active');
        domClass.remove(dom.byId('barRecentApps').parentNode);
        domClass.remove(dom.byId('barAllApps').parentNode);

        domStyle.set('sdRecentAppsListContent', 'display', 'none');
        domStyle.set('sdAllAppsListContent', 'display', 'none');
        domStyle.set('sdElseAppListContent', 'display', '');
    });

    var openShareDialog = function()
    {
        adjustShareDialogSize();
        registry.byId('shareDialog').show();
        // disable JS gesture listener, enable native gesture listener
        annoUtil.disableJSGesture();
        annoUtil.enableNativeGesture();

        if (!appNameListFetched)
        {
            cordova.exec(
                function (result)
                {
                    if (result&&result.length>0)
                    {
                        fillAppNameList(result, true);
                    }

                    appNameListFetched = true;
                },
                function (err)
                {
                    // alert(err.message);
                    annoUtil.showMessageDialog(err.message);
                },
                "AnnoCordovaPlugin",
                'get_recent_applist',
                [10]
            );

            cordova.exec(
                function (result)
                {
                    if (result&&result.length>0)
                    {
                        appNameList = result;
                        fillAppNameList(result, false);
                        appNameListFetched = true;
                    }
                },
                function (err)
                {
                    // alert(err.message);
                    annoUtil.showMessageDialog(err.message);
                },
                "AnnoCordovaPlugin",
                'get_installed_app_list',
                []
            );
        }

        var tabBox = domGeom.getMarginBox('tabContainer');
        domStyle.set('sdAppList', 'height', (viewPoint.h-sdTitleHeight-tabBox.h-sdBottom-shareDialogGap)+'px');

        if (annoUtil.isIOS())
        {
            // highlight 'something else' tab on iOS
            dom.byId('barElseApps').click();
        }
    };

    var fillAppNameList = function(appList, recentApp)
    {
        var content = "";
        for (var i= 0,c=appList.length;i<c;i++)
        {
            if (recentApp)
            {
                content = content + '<div class="appNameItem"><div class="appNameValue">'+appList[i]+'</div></div>'
            }
            else
            {
                content = content + '<div class="appNameItem"><div class="appNameValue">'+appList[i].name+'</div></div>'
            }
        }

        if (recentApp)
        {
            dom.byId('sdRecentAppsListContent').innerHTML = content;
        }
        else
        {
            dom.byId('sdAllAppsListContent').innerHTML = content;
        }
    };

    var updateLastShapePos = function(shapeType)
    {
        if (shapeType == "ArrowLine")
        {
            lastShapePos.y1+= 50;
            lastShapePos.y2+= 50;
        }
        else if (shapeType == "Rectangle")
        {
            lastShapePos.y1+= defaultShapeHeight+50;
            lastShapePos.y2+= defaultShapeHeight+50;
        }

        if (lastShapePos.y1 >= (viewPoint.h-barHeight)||lastShapePos.y2 >= (viewPoint.h-barHeight))
        {
            lastShapePos.y1 = 100+defaultShapeHeight;
            lastShapePos.y2 = 100;
        }
    };

    var toLeft = false;
    var updateLastBlackRectanglePos = function()
    {
        if (toLeft)
        {
            lastBlackRectanglePos.x1-= 100;
            lastBlackRectanglePos.y1+= defaultShapeHeight+50;
            lastBlackRectanglePos.y2+= defaultShapeHeight+50;
        }
        else
        {
            lastBlackRectanglePos.x1+= 100;
            lastBlackRectanglePos.y1+= defaultShapeHeight+50;
            lastBlackRectanglePos.y2+= defaultShapeHeight+50;
        }

        if (lastBlackRectanglePos.y1 >= (viewPoint.h-barHeight)||lastBlackRectanglePos.y2 >= (viewPoint.h-barHeight))
        {
            lastBlackRectanglePos.y1 = 100+defaultShapeHeight;
            lastBlackRectanglePos.y2 = 100;
        }

        if ((lastBlackRectanglePos.x1+defaultShapeWidth) >= (viewPoint.w))
        {
            lastBlackRectanglePos.x1 = 100+defaultShapeWidth;
        }

        if ((lastBlackRectanglePos.x1) <0 )
        {
            lastBlackRectanglePos.x1 = 20;
        }

        toLeft = !toLeft;
    };

    var createBlackRectangle = function()
    {
        var rectangle = surface.createAnonymizedRectangle({
            startX: lastBlackRectanglePos.x1,
            startY: lastBlackRectanglePos.y1 - defaultShapeHeight - 50,
            width: defaultShapeWidth,
            height: defaultShapeHeight
        });

        updateLastBlackRectanglePos();
    };

    var switchMode = function(mode)
    {
        drawMode = true;
        var lineStrokeStyle = {color: level==1?level1Color:level2Color, width: 3},
            drawElements, drawItem;
        var commentBox;

        if (editMode)
        {
            originalGrayBoxes = {};
            originalGrayBoxCnt = 0;
            drawElements = dojoJson.parse(editDrawElementsJson);

            surface.switchMode(true);
            surface.parse(drawElements, lineStrokeStyle, true);

            for (var p in drawElements)
            {
                drawItem = drawElements[p];

                if (drawItem.type == surface.shapeTypes.AnonymizedRectangle)
                {
                    originalGrayBoxes[p] = drawItem;
                    originalGrayBoxCnt++;
                }
            }

            for (var p in surface.registry)
            {
                commentBox = surface.registry[p];

                if (commentBox.shapeType == surface.shapeTypes.CommentBox)
                {
                    commentBox.onCommentBoxInput = checkBarShareState;
                    commentBox.onCommentBoxFocus = hideBottomNavBar;
                    commentBox.onCommentBoxBlur = showBottomNavBar;
                }
            }

            checkBarShareState();
        }
        else
        {
            // create default comment box
            commentBox = surface.createCommentBox({deletable:false, startX:lastShapePos.x1, startY: lastShapePos.y1-defaultShapeHeight-50, width: defaultShapeWidth, height: defaultShapeHeight,lineStrokeStyle:lineStrokeStyle});
            updateLastShapePos('Rectangle');

            surface.switchMode(true);

            window.setTimeout(function(){
                commentBox.animateEarControl();
            }, 500);

            commentBox.onCommentBoxInput = checkBarShareState;
            commentBox.onCommentBoxFocus = hideBottomNavBar;
            commentBox.onCommentBoxBlur = showBottomNavBar;
        }
    };

    var showBottomNavBar = function()
    {
        window.setTimeout(function(){
            domStyle.set("bottomBarContainer", "display", "");
        }, 500);
    };

    var hideBottomNavBar = function()
    {
        domStyle.set("bottomBarContainer", "display", "none");
    };

    var drawImageHiddenCanvas = function()
    {
        var hiddenCanvas = dom.byId('hiddenCanvas');
        hiddenCanvas.width = viewPoint.w-totalSpace*2;
        hiddenCanvas.height = viewPoint.h-borderWidth*2-barHeight;
        var ctx = hiddenCanvas.getContext('2d');
        var hiddenImage = new Image();
        hiddenImage.onload = function()
        {
            ctx.drawImage(hiddenImage, 0, 0, viewPoint.w-totalSpace*2, viewPoint.h-borderWidth*2-barHeight);
        };

        if (editMode)
        {
            hiddenImage.src = window.localStorage.getItem(annoUtil.localStorageKeys.currentImageData);
            window.setTimeout(function(){
                window.localStorage.removeItem(annoUtil.localStorageKeys.currentImageData);
            }, 5000);
        }
        else
        {
            hiddenImage.src = screenShotPath;
        }
    };

    var initBackgroundImage = function()
    {
        if (cordova.exec)
        {
            cordova.exec(
                function (result)
                {
                    if (result)
                    {
                        screenShotPath = result.screenshotPath;
                        level = result.level;
                        isAnno = result.isAnno;
                        editMode = result.editMode;

                        if (editMode)
                        {
                            dom.byId('imageScreenshot').src = window.localStorage.getItem(annoUtil.localStorageKeys.currentImageData);
                            var currentAnnoData = dojoJson.parse(window.localStorage.getItem(annoUtil.localStorageKeys.currentAnnoData));

                            level = currentAnnoData.level;
                            editAnnoId = currentAnnoData.id;
                            editAppName = currentAnnoData.app;
                            editDrawElementsJson = currentAnnoData.draw_elements;

                            window.localStorage.removeItem(annoUtil.localStorageKeys.currentAnnoData);
                        }
                        else
                        {
                            dom.byId('imageScreenshot').src = screenShotPath;
                        }

                        if (level == 1)
                        {
                            domStyle.set('screenshotContainer', 'borderColor', level1Color);
                        }
                        else
                        {
                            domStyle.set('screenshotContainer', 'borderColor', level2Color);
                        }

                        window.setTimeout(function()
                        {
                            switchMode(true);
                            adjustShareDialogSize();
                            drawImageHiddenCanvas();
                        }, 1000);
                    }
                    else
                    {
                        window.setTimeout(initBackgroundImage, 50);
                    }
                },
                function (err)
                {
                    // alert(err.message);
                    annoUtil.showMessageDialog(err.message);
                },
                "AnnoCordovaPlugin",
                'get_screenshot_path',
                []
            );
        }
        else
        {
            window.setTimeout(initBackgroundImage, 50);
        }

    };

    var adjustShareDialogSize = function()
    {
        viewPoint = win.getBox();

        if (level == 1)
        {
            if (isAnno)
            {
                // set share dialog size
                domStyle.set('shareDialog', {
                    width: (viewPoint.w-shareDialogGap)+'px',
                    height: (viewPoint.h-shareDialogGap)+'px'
                });
            }
            else
            {
                domStyle.set('sdAppList','display','none');
                domStyle.set('sdTitle','display','none');
                domStyle.set('sdShareBtn','paddingTop','18px');
                domStyle.set('sdBottom',{
                    'paddingTop':'45px'
                });


                // set share dialog size
                domStyle.set('shareDialog', {
                    width: '300px',
                    height: '150px'
                });
            }

        }
        else
        {
            domStyle.set('sdAppList','display','none');
            domStyle.set('sdTitle','display','none');
            domStyle.set('sdShareBtn','paddingTop','18px');
            domStyle.set('sdBottom',{
                'paddingTop':'45px'
            });


            // set share dialog size
            domStyle.set('shareDialog', {
                width: '300px',
                height: '150px'
            });
        }
    };

    var insertSimpleCommentAnno = function()
    {
        var commentText = defaultCommentBox.inputElement.value;

        if (commentText.length <=0)
        {
            // alert("Please enter suggestion.");
            annoUtil.showMessageDialog("Please enter suggestion.");
            return;
        }

        selectedAppName = selectedAppName||dom.byId("txtAppName").value;

        annoUtil.showLoadingIndicator();

        var deviceInfo = annoUtil.getDeviceInfo();
        var pluginParam = [], isScreenshotAnonymized = surface.isScreenshotAnonymized();

        if (isScreenshotAnonymized)
        {
            pluginParam[0] = outputImage();
        }

        cordova.exec(
            function (result)
            {
                var imageKey = result.imageAttrs.imageKey;
                var screenshotDirPath = result.imageAttrs.screenshotPath;
                var appInfo = result.appInfo;

                var earPoint = defaultCommentBox.getRelativeEarPoint();

                var annoItem = {
                    "anno_text":defaultCommentBox.inputElement.value,
                    "image":imageKey,
                    "simple_x":earPoint.x,
                    "simple_y":earPoint.y,
                    "simple_circle_on_top":!defaultCommentBox.earLow,
                    "app_version":appInfo.appVersion,
                    "simple_is_moved":defaultCommentBox.isMoved,
                    "level":appInfo.level,
                    "app_name":selectedAppName||appInfo.appName,
                    "device_model":deviceInfo.model,
                    "os_name":deviceInfo.osName,
                    "os_version":deviceInfo.osVersion,
                    "anno_type":"simple comment",
                    "screenshot_is_anonymized":isScreenshotAnonymized
                };

                AnnoDataHandler.insertAnno(annoItem, appInfo.source, screenshotDirPath);
            },
            function (err)
            {
                // alert(err.message);
                annoUtil.showMessageDialog(err.message);
            },
            "AnnoCordovaPlugin",
            'process_image_and_appinfo',
            pluginParam
        );
    };

    var insertDrawCommentAnno = function()
    {
        if (!surface.allCommentFilled())
        {
            annoUtil.showMessageDialog("Please enter suggestion.");
            return;
        }

        selectedAppName = selectedAppName||dom.byId("txtAppName").value.trim();

        annoUtil.showLoadingIndicator();

        var deviceInfo = annoUtil.getDeviceInfo();
        console.error(JSON.stringify(deviceInfo));

        var pluginParam = [], isScreenshotAnonymized = surface.isScreenshotAnonymized();

        if (isScreenshotAnonymized)
        {
            pluginParam[0] = outputImage();
        }

        cordova.exec(
            function (result)
            {
                var imageKey = result.imageAttrs.imageKey;
                var screenshotDirPath = result.imageAttrs.screenshotPath;
                var appInfo = result.appInfo;

                var annoItem = {
                    "anno_text":surface.getConcatenatedComment(),
                    "image":imageKey,
                    "simple_x":0,
                    "simple_y":0,
                    "simple_circle_on_top":false,
                    "app_version":appInfo.appVersion,
                    "simple_is_moved":false,
                    "level":appInfo.level,
                    "app_name":selectedAppName||appInfo.appName,
                    "device_model":deviceInfo.model,
                    "os_name":deviceInfo.osName,
                    "os_version":deviceInfo.osVersion,
                    "draw_elements":dojoJson.stringify(surface.toJSON()),
                    "screenshot_is_anonymized":isScreenshotAnonymized,
                    "anno_type":"draw comment"
                };

                AnnoDataHandler.insertAnno(annoItem, appInfo.source, screenshotDirPath);
            },
            function (err)
            {
                // alert(err.message);
                annoUtil.showMessageDialog(err.message);
            },
            "AnnoCordovaPlugin",
            'process_image_and_appinfo',
            pluginParam
        );
    };

    var updateDrawCommentAnno = function()
    {
        if (!surface.allCommentFilled())
        {
            annoUtil.showMessageDialog("Please enter suggestion.");
            return;
        }

        annoUtil.showLoadingIndicator();

        var pluginParam = [], isScreenshotAnonymized = surface.isScreenshotAnonymized(),
            shapesJson = surface.toJSON();
        var appName = selectedAppName||dom.byId("txtAppName").value.trim()||editAppName;
        var annoItem, callbackAnnoItem;

        for (var p in originalGrayBoxes)
        {
            shapesJson[p] = originalGrayBoxes[p];
        }

        if (isScreenshotAnonymized)
        {
            pluginParam[0] = outputImage();
        }

        if (isScreenshotAnonymized)
        {
            cordova.exec(
                function (result)
                {
                    var imageKey = result.imageAttrs.imageKey;
                    var screenshotDirPath = result.imageAttrs.screenshotPath;

                    annoItem = {
                        "anno_text":surface.getConcatenatedComment(),
                        "app_name":appName,
                        "image":imageKey,
                        "draw_elements":dojoJson.stringify(shapesJson),
                        "screenshot_is_anonymized":isScreenshotAnonymized,
                        "anno_type":"draw comment",
                        "level":level
                    };

                    callbackAnnoItem = {
                        "comment":annoItem["anno_text"],
                        "appName":annoItem["app_name"],
                        "draw_elements":annoItem["draw_elements"],
                        "image":screenshotDirPath+"/"+annoItem["image"]
                    };
                    AnnoDataHandler.updateAnno(editAnnoId, annoItem, screenshotDirPath, function(){
                        window.localStorage.setItem(annoUtil.localStorageKeys.editAnnoDone, "done");
                        window.localStorage.setItem(annoUtil.localStorageKeys.updatedAnnoData, dojoJson.stringify(callbackAnnoItem));
                    });
                },
                function (err)
                {
                    // alert(err.message);
                    annoUtil.showMessageDialog(err.message);
                },
                "AnnoCordovaPlugin",
                'process_image_and_appinfo',
                pluginParam
            );
        }
        else
        {
            isScreenshotAnonymized =isScreenshotAnonymized||originalGrayBoxCnt>0;
            annoItem = {
                "anno_text":surface.getConcatenatedComment(),
                "app_name":appName,
                "draw_elements":dojoJson.stringify(shapesJson),
                "screenshot_is_anonymized":isScreenshotAnonymized,
                "anno_type":"draw comment",
                "level":level
            };

            callbackAnnoItem = {
                "comment":annoItem["anno_text"],
                "appName":annoItem["app_name"],
                "draw_elements":annoItem["draw_elements"]
            };

            AnnoDataHandler.updateAnno(editAnnoId, annoItem, "", function(){
                window.localStorage.setItem(annoUtil.localStorageKeys.editAnnoDone, "done");
                window.localStorage.setItem(annoUtil.localStorageKeys.updatedAnnoData, dojoJson.stringify(callbackAnnoItem));
            });
        }
    };

    var outputImage = function()
    {
        var hiddenCanvas = dom.byId('hiddenCanvas');
        var ctx = hiddenCanvas.getContext('2d');
        ctx.fillStyle = "gray";

        var shapes = surface.registry;

        for (var p in shapes)
        {
            if (shapes[p].shapeType == "AnonymizedRectangle")
            {
                var shape = shapes[p].getShape();

                ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            }
        }

        var dataUrl = hiddenCanvas.toDataURL("image/png");
        var pos = dataUrl.lastIndexOf(",");
        dataUrl = dataUrl.substr(pos+1);

        return dataUrl;
    };

    var hideMenuDialog = function()
    {
        var menusDialog = registry.byId('menusDialog');
        menusDialog.hide();

        domClass.remove(menusDialog._cover[0], "transparentBack");
        domStyle.set(menusDialog._cover[0], {"height": "100%"});

        domClass.remove("barComment", 'barIconInactive');
        domClass.remove("barArrow", 'barIconInactive');
        domClass.remove("barBlackRectangle", 'barIconInactive');
        domClass.remove("barRectangle", 'barIconInactive');

        if (surface.allCommentFilled())
        {
            domClass.remove("barShare", 'barIconInactive');
        }

        domClass.remove("barMoreMenu", 'barMoreMenuActive');
    };

    var showMenuDialog = function()
    {
        var viewPoint = win.getBox();

        var menusDialog = registry.byId('menusDialog');
        menusDialog.show();
        domClass.add(menusDialog._cover[0], "transparentBack");
        domStyle.set(menusDialog._cover[0], {"height": (viewPoint.h-barHeight)+"px"});

        domClass.add("barComment", 'barIconInactive');
        domClass.add("barArrow", 'barIconInactive');
        domClass.add("barBlackRectangle", 'barIconInactive');
        domClass.add("barRectangle", 'barIconInactive');
        domClass.add("barShare", 'barIconInactive');

        domClass.add("barMoreMenu", 'barMoreMenuActive');

        surface.removeSelection();
    };

    var checkBarShareState = function()
    {
        if (surface.allCommentFilled())
        {
            domClass.remove("barShare", 'barIconInactive');
        }
        else
        {
            domClass.add("barShare", 'barIconInactive');
        }
    };

    var init = function()
    {
        if (DBUtil.userChecked)
        {
            var authResult = OAuthUtil.isAuthorized();
            if (annoUtil.hasConnection()&&!annoUtil.isRunningAsPlugin()&&!authResult.authorized)
            {
                OAuthUtil.openAuthPage("annodraw");
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
                });

                initBackgroundImage();

                window.setTimeout(function(){

                    viewPoint = win.getBox();
                    totalSpace = Math.floor(viewPoint.w*0.02);
                    borderWidth = Math.round(totalSpace/2);

                    lastShapePos = {
                        x1:Math.round((viewPoint.w-defaultShapeWidth)/2),
                        y1:100+defaultShapeHeight,
                        x2:Math.round((viewPoint.w-defaultShapeWidth)/2)+defaultShapeWidth,
                        y2:100
                    };

                    lastBlackRectanglePos = {
                        x1:Math.round((viewPoint.w-defaultShapeWidth)/2),
                        y1:100+defaultShapeHeight,
                        x2:Math.round((viewPoint.w-defaultShapeWidth)/2)+defaultShapeWidth,
                        y2:100
                    };

                    surface = window.surface = new Surface({
                        container: dom.byId("gfxCanvasContainer"),
                        width:viewPoint.w-totalSpace*2,
                        height:viewPoint.h-borderWidth*2-barHeight,
                        borderWidth:borderWidth,
                        drawMode:true
                    });

                    domStyle.set(surface.container, {
                        'borderWidth': borderWidth+'px',
                        'left': borderWidth+"px"
                    });

                    connect.connect(surface, "onShapeRemoved", function()
                    {
                        if (!surface.hasShapes())
                        {
                            lastShapePos = {
                                x1:Math.round((viewPoint.w-defaultShapeWidth)/2),
                                y1:100+defaultShapeHeight,
                                x2:Math.round((viewPoint.w-defaultShapeWidth)/2)+defaultShapeWidth,
                                y2:100
                            };

                            domClass.add("barShare", 'barIconInactive');
                        }
                        else
                        {
                            checkBarShareState();
                        }
                    });

                    // set screenshot container size
                    domStyle.set('screenshotContainer', {
                        width: (viewPoint.w-totalSpace*2)+'px',
                        height: (viewPoint.h-borderWidth*2-barHeight)+'px',
                        borderWidth:borderWidth+"px",
                        left: borderWidth+"px"
                    });

                    domStyle.set('sdTitle', 'height', sdTitleHeight+'px');
                    domStyle.set('sdAppList', 'height', (viewPoint.h-sdTitleHeight-sdTabBarHeight-sdBottom-shareDialogGap)+'px');
                    domStyle.set('sdBottom', 'height', sdBottom+'px');

                    // reposition the menus dialog
                    var menusDialog = registry.byId('menusDialog');
                    menusDialog.top = (viewPoint.h-barHeight-44)+'px';
                    menusDialog.left = (viewPoint.w-204)+'px';
                    domStyle.set(menusDialog.domNode, "backgroundColor", "white");

                    if (annoUtil.isRunningAsPlugin())
                    {
                        domStyle.set('menuItemFeed', 'display', '');
                        domStyle.set(menusDialog.domNode, 'height', '80px');
                        menusDialog.top = (viewPoint.h-barHeight-84)+'px';
                    }

                    connect.connect(dom.byId("barMoreMenu"), 'click', function(e)
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
                    });
                }, 500);
            }

            // enable JS gesture listener, disable native gesture
            annoUtil.enableJSGesture();
            annoUtil.disableNativeGesture();

            // set the pick list dialog title
            dom.byId('sdTitle').children[0].innerHTML = annoUtil.getResourceString("title_app_pick_list");
            dom.byId('appOsName').innerHTML = annoUtil.isIOS()?"iOS":"Android";
        }
        else
        {
            window.setTimeout(init, 20);
        }
    };

    document.addEventListener("backbutton", function(){

        var menusDialog = registry.byId('menusDialog');
        var shareDialog = registry.byId('shareDialog');
        if (menusDialog.domNode.style.display === "")
        {
            hideMenuDialog();
        }
        else if (shareDialog.domNode.style.display === "")
        {
            shareDialog.hide();
            // enable JS gesture listener, disable native gesture
            annoUtil.enableJSGesture();
            annoUtil.disableNativeGesture();
        }
        else
        {
            window.localStorage.setItem(annoUtil.localStorageKeys.editAnnoDone, "cancel");

            navigator.app.exitApp();
        }
    }, false);

    document.addEventListener("deviceready", function(){
        DBUtil.initDB(function(){
            console.error("DB is readay!");
            annoUtil.readSettings(function(){
                init();
            });
        });
    }, false);
});