require([
    "anno/draw/Surface",
    "dojo/_base/connect",
    "dojo/dom",
    "dojo/dom-class",
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
], function (Surface, connect, dom, domClass, domStyle, dojoJson, query, ready, touch, win, registry, DBUtil, annoUtil, OAuthUtil, AnnoDataHandler)
{
    var viewPoint,
        defaultShapeWidth = 160,
        defaultShapeHeight = 80,
        shareDialogGap = 80,
        borderWidth;

    var sdTitleHeight = 60,
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
    });

    connect.connect(dom.byId("txtAppName"), 'keydown', function(e)
    {
        if (e.keyCode == 13)
        {
            dom.byId("hiddenBtn").focus();
            dom.byId("hiddenBtn").click();
        }
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
                        fillAppNameList(result);
                    }

                    appNameListFetched = true;
                },
                function (err)
                {
                    alert(err.message);
                },
                "AnnoCordovaPlugin",
                'get_recent_applist',
                [10]
            );
        }
    };

    connect.connect(dom.byId("barBlackRectangle"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barBlackRectangle"), 'barIconInactive')) return;

        createBlackRectangle();
    });

    var fillAppNameList = function(appList)
    {
        var content = "";
        for (var i= 0,c=appList.length;i<c;i++)
        {
            if (i == 0)
            {
                content = content + '<div class="appNameItem firstAppNameItem"><div class="appNameValue">'+appList[i]+'</div></div>'
            }
            else
            {
                content = content + '<div class="appNameItem"><div class="appNameValue">'+appList[i]+'</div></div>'
            }
        }

        dom.byId('sdAppListContent').innerHTML = content;
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

        toLeft = !toLeft;
    };

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

        if (drawMode)
        {
            insertDrawCommentAnno();
        }
        else
        {
            insertSimpleCommentAnno();
        }
    });

    // home/feeds/cancel button
    connect.connect(dom.byId("menuItemFeed"), 'click', function(e)
    {
        var action;
        if (level == 1)
        {
            action = "goto_anno_home";
        }
        else
        {
            action = "exit_current_activity";
        }

        cordova.exec(
            function (result)
            {

            },
            function (err)
            {
                alert(err.message);
            },
            "AnnoCordovaPlugin",
            action,
            []
        );
    });

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
        var lineStrokeStyle = {color: level==1?level1Color:level2Color, width: 3};

        if (editMode)
        {
            surface.switchMode(true);
            surface.parse(dojoJson.parse(editDrawElementsJson), lineStrokeStyle, true);
        }
        else
        {
            // create default comment box
            var commentBox = surface.createCommentBox({deletable:false, startX:lastShapePos.x1, startY: lastShapePos.y1-defaultShapeHeight-50, width: defaultShapeWidth, height: defaultShapeHeight,lineStrokeStyle:lineStrokeStyle});
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
        hiddenImage.src = screenShotPath;
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
                        editAppName = result.appName;
                        editDrawElementsJson = result.drawElementsJson;

                        dom.byId('imageScreenshot').src = screenShotPath;

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
                    alert(err.message);
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
            alert("Please enter suggestion.");
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
                alert(err.message);
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

        selectedAppName = selectedAppName||dom.byId("txtAppName").value;

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
                alert(err.message);
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
                    "app_name":editAppName,
                    "draw_elements":dojoJson.stringify(surface.toJSON()),
                    "screenshot_is_anonymized":isScreenshotAnonymized
                };

                AnnoDataHandler.insertAnno(annoItem, appInfo.source, screenshotDirPath);
            },
            function (err)
            {
                alert(err.message);
            },
            "AnnoCordovaPlugin",
            'process_image_and_appinfo',
            pluginParam
        );
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
            if (annoUtil.hasConnection()&&!authResult.authorized)
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
                        }

                        checkBarShareState();
                    });

                    // set screenshot container size
                    domStyle.set('screenshotContainer', {
                        width: (viewPoint.w-totalSpace*2)+'px',
                        height: (viewPoint.h-borderWidth*2-barHeight)+'px',
                        borderWidth:borderWidth+"px",
                        left: borderWidth+"px"
                    });

                    domStyle.set('sdTitle', 'height', sdTitleHeight+'px');
                    domStyle.set('sdAppList', 'height', (viewPoint.h-sdTitleHeight-sdBottom-shareDialogGap)+'px');
                    domStyle.set('sdBottom', 'height', sdBottom+'px');

                    // reposition the menus dialog
                    var menusDialog = registry.byId('menusDialog');
                    menusDialog.top = (viewPoint.h-barHeight-44)+'px';
                    menusDialog.left = (viewPoint.w-204)+'px';
                    domStyle.set(menusDialog.domNode, "backgroundColor", "white");

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
            navigator.app.exitApp();
        }
    }, false);

    document.addEventListener("deviceready", function(){
        DBUtil.initDB(function(){
            console.error("DB is readay!");
            annoUtil.readSettings(function(){

            });
        });
    }, false);

    ready(init);
});