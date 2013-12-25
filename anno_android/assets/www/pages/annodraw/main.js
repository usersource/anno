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
        sdBottom = 80;

    var lastShapePos;
    var lastBlackRectanglePos;

    var surface, drawMode = false;
    var defaultCommentBox;

    var selectedAppName, screenShotPath;
    var level1Color = "#ff9900",
        level2Color = "#ff0000";
    var level = 1;
    var isAnno = false;

    connect.connect(dom.byId("barArrow"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barArrow"), 'barIconDisabled')) return;

        var arrowLine = surface.createArrowLine({x1:lastShapePos.x1, y1: lastShapePos.y1, x2: lastShapePos.x2, y2: lastShapePos.y2});
        updateLastShapePos(arrowLine.shapeType);
    });

    connect.connect(dom.byId("barRectangle"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barRectangle"), 'barIconDisabled')) return;

        var rectangle = surface.createRectangle({startX:lastShapePos.x1, startY: lastShapePos.y1-defaultShapeHeight-50, width: defaultShapeWidth, height: defaultShapeHeight});
        updateLastShapePos(rectangle.shapeType);
    });

    connect.connect(dom.byId("barComment"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barComment"), 'barIconDisabled')) return;

        var lineStrokeStyle = {color: level==1?level1Color:level2Color, width: 3};
        var commentBox = surface.createCommentBox({startX:lastShapePos.x1, startY: lastShapePos.y1-defaultShapeHeight-50, width: defaultShapeWidth, height: defaultShapeHeight,lineStrokeStyle:lineStrokeStyle});
        updateLastShapePos('Rectangle');
    });

    connect.connect(dom.byId("barShare"), touch.release, function()
    {
        openShareDialog();
    });

    var openShareDialog = function()
    {
        registry.byId('shareDialog').show();

        cordova.exec(
            function (result)
            {
                if (result&&result.length>0)
                {
                    fillAppNameList(result);
                }
            },
            function (err)
            {
                alert(err.message);
            },
            "AnnoCordovaPlugin",
            'get_recent_applist',
            [10]
        );
    };

    connect.connect(dom.byId("barBlackRectangle"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barBlackRectangle"), 'barIconDisabled2')) return;

        createBlackRectangle();
    });

    connect.connect(dom.byId("barBlackRectangleDone"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barBlackRectangle"), 'barIconDisabled')) return;

        if (drawMode)
        {
            domStyle.set('bottomBarContainer', 'display', '');
            domStyle.set('bottomBarBlackContainer', 'display', 'none');
        }

        registry.byId('shareDialog').show();
    });

    connect.connect(dom.byId("btnDraw"), touch.release, function()
    {
        switchMode(true);
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

        dom.byId('sdAppList').innerHTML = content;
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

        if (lastShapePos.y1 >= viewPoint.h||lastShapePos.y2 >= viewPoint.h)
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

        if (lastBlackRectanglePos.y1 >= viewPoint.h||lastBlackRectanglePos.y2 >= viewPoint.h)
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

        var allItems = query('.appNameItem', dom.byId("sdAppList"));

        for (var i=0;i<allItems.length;i++)
        {
            domClass.add(allItems[i], 'appNameItem-gray');
        }

        domClass.remove(itemNode, 'appNameItem-gray');

        selectedAppName = itemNode.children[0].innerHTML;
    });

    // share button
    connect.connect(dom.byId("btnShare"), 'click', function(e)
    {
        if (drawMode)
        {
            domStyle.set('bottomBarContainer', 'display', '');
            domStyle.set('bottomBarBlackContainer', 'display', 'none');
        }

        registry.byId('shareDialog').hide();

        if (drawMode)
        {
            saveDrawCommentAnno();
        }
        else
        {
            saveSimpleCommentAnno();
        }
    });

    // home/feeds/cancel button
    connect.connect(dom.byId("btnHome"), 'click', function(e)
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

    window.onChkHidePersonalDataChange = function(e)
    {
        var checked = registry.byId('chkHidePersonalData').checked;

        if (checked)
        {
            registry.byId('shareDialog').hide();
            domStyle.set('bottomBarContainer', 'display', 'none');
            domStyle.set('bottomBarBlackContainer', 'display', '');
            createBlackRectangle();
        }
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
        // remove default comment box
        surface.removeShape(defaultCommentBox);
        domStyle.set('bottomBarContainer', 'display', '');
        domStyle.set(dom.byId('btnHome'), 'display', 'none');
        domStyle.set(dom.byId('btnDraw'), 'display', 'none');
        domStyle.set(dom.byId('topBar'), 'display', 'none');

        // create default comment box
        var lineStrokeStyle = {color: level==1?level1Color:level2Color, width: 3};
        var commentBox = surface.createCommentBox({deletable:false, startX:lastShapePos.x1, startY: lastShapePos.y1-defaultShapeHeight-50, width: defaultShapeWidth, height: defaultShapeHeight,lineStrokeStyle:lineStrokeStyle});
        updateLastShapePos('Rectangle');

        surface.switchMode(true);
    };

    var drawImageHiddenCanvas = function()
    {
        var hiddenCanvas = dom.byId('hiddenCanvas');
        hiddenCanvas.width = viewPoint.w-borderWidth*2;;
        hiddenCanvas.height = viewPoint.h-borderWidth*2;;
        var ctx = hiddenCanvas.getContext('2d');
        var hiddenImage = new Image();
        hiddenImage.onload = function()
        {
            ctx.drawImage(hiddenImage, 0, 0, viewPoint.w-borderWidth*2, viewPoint.h-borderWidth*2);
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
                        var datas = result.split("|");
                        console.error("sc Path: "+result);
                        screenShotPath = datas[0];
                        level = datas[1];
                        isAnno = datas[2] == "true";
                        dom.byId('imageScreenshot').src = screenShotPath;

                        if (level == 1)
                        {
                            domStyle.set('screenshotContainer', 'borderColor', level1Color);
                        }
                        else
                        {
                            domStyle.set('screenshotContainer', 'borderColor', level2Color);
                            dom.byId('btnHome').innerHTML = "Cancel";
                        }


                        window.setTimeout(function(){
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

    var saveSimpleCommentAnno = function()
    {
        var commentText = defaultCommentBox.inputElement.value;

        if (commentText.length <=0)
        {
            alert("Please enter suggestion.");
            return;
        }

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

                AnnoDataHandler.saveAnno(annoItem, appInfo.source, screenshotDirPath);
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

    var saveDrawCommentAnno = function()
    {
        if (!surface.allCommentFilled())
        {
            alert("Please enter suggestion.");
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

                AnnoDataHandler.saveAnno(annoItem, appInfo.source, screenshotDirPath);
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

    var init = function()
    {
        if (DBUtil.userChecked)
        {
            var authResult = OAuthUtil.isAuthorized();
            if (annoUtil.hasConnection()&&!authResult.authorized)
            {
                OAuthUtil.openAuthPage();
                return;
            }
            else
            {
                AnnoDataHandler.getCurrentUserInfo(function(userInfo){
                    if (userInfo.signinMethod == OAuthUtil.signinMethod.anno)
                    {
                        if (authResult.newUser)
                        {
                            annoUtil.startActivity("Intro", false);
                        }

                        OAuthUtil.processBasicAuthToken(userInfo);
                    }
                });

                initBackgroundImage();

                window.setTimeout(function(){

                    viewPoint = win.getBox();
                    borderWidth = Math.floor(viewPoint.w*0.02);

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
                        width:viewPoint.w-borderWidth*2,
                        height:viewPoint.h-borderWidth*2,
                        borderWidth:borderWidth,
                        drawMode:true
                    });

                    domStyle.set(surface.container, 'borderWidth', borderWidth+'px');

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
                    });

                    connect.connect(surface, "onShapeSelected", function(selected)
                    {
                        if (selected)
                        {
                            domClass.add(dom.byId("barArrow"), 'barIconDisabled');
                            domClass.add(dom.byId("barRectangle"), 'barIconDisabled');
                            domClass.add(dom.byId("barComment"), 'barIconDisabled');
                            domClass.add(dom.byId("barShare"), 'barIconDisabled');
                            /*domClass.remove(dom.byId("barBlackRectangle"), 'barBlackActive');
                             domClass.add(dom.byId("barBlackRectangle"), 'barIconDisabled2');*/
                            domClass.add(dom.byId("barBlackRectangleDone"), 'barIconDisabled');
                        }
                        else
                        {
                            domClass.remove(dom.byId("barArrow"), 'barIconDisabled');
                            domClass.remove(dom.byId("barRectangle"), 'barIconDisabled');
                            domClass.remove(dom.byId("barComment"), 'barIconDisabled');
                            domClass.remove(dom.byId("barShare"), 'barIconDisabled');
                            /*domClass.remove(dom.byId("barBlackRectangle"), 'barIconDisabled2');
                             domClass.add(dom.byId("barBlackRectangle"), 'barBlackActive');*/
                            domClass.remove(dom.byId("barBlackRectangleDone"), 'barIconDisabled');
                        }
                    });

                    // set screenshot container size
                    domStyle.set('screenshotContainer', {
                        width: (viewPoint.w-borderWidth*2)+'px',
                        height: (viewPoint.h-borderWidth*2)+'px',
                        borderWidth:borderWidth+"px"
                    });

                    domStyle.set('sdTitle', 'height', sdTitleHeight+'px');
                    domStyle.set('sdAppList', 'height', (viewPoint.h-sdTitleHeight-sdBottom-shareDialogGap)+'px');
                    domStyle.set('sdBottom', 'height', sdBottom+'px');

                    var lineStrokeStyle = {color: level==1?level1Color:level2Color, width: 3};
                    var epLineStyle, epFillStyle;

                    if (level==1)
                    {
                        epLineStyle = {color:'#FFA500', width:1};
                        epFillStyle = "rgba(255,165,0, 0.4)";
                    }
                    else
                    {
                        epLineStyle = {color:'#FF0000',width:1};
                        epFillStyle = "rgba(255,12,9, 0.4)";
                    }
                    defaultCommentBox = surface.createSimpleCommentBox({
                        deletable:false,
                        startX2:lastShapePos.x1,
                        startY: lastShapePos.y1-defaultShapeHeight-50,
                        width: defaultShapeWidth,
                        height: defaultShapeHeight,
                        lineStrokeStyle:lineStrokeStyle,
                        endpointStrokeStyle:epLineStyle,
                        endpointFillStyle:epFillStyle
                    });

                    connect.connect(defaultCommentBox.shareBtnNode, "click", function()
                    {
                        defaultCommentBox._closeKeybord();
                        window.setTimeout(function(){
                            openShareDialog();
                        }, 300);
                    });

                    defaultCommentBox.onCommentBoxFocus = function(commentBox)
                    {
                        if (commentBox.earLow)
                        {
                            if ((commentBox.pathPoints[2].y+20+400) >= viewPoint.h)
                            {
                                var shift = viewPoint.h-(commentBox.pathPoints[2].y+20+400);
                                domStyle.set(surface.container, 'top', shift+'px');
                                domStyle.set('screenshotContainer', 'top', shift+'px');

                                var top = parseInt(commentBox.txtNode.style.top);
                                domStyle.set(commentBox.txtNode, 'top', (top+shift)+'px');
                                domStyle.set(commentBox.inputNode, 'top', (top+shift)+'px');

                                commentBox._shift = shift;
                            }
                        }
                    };

                    defaultCommentBox.onCommentBoxBlur = function (commentBox)
                    {
                        console.error(surface.container.style.top);
                        if (commentBox._shift != null)
                        {
                            domStyle.set(surface.container, 'top', '0px');
                            domStyle.set('screenshotContainer', 'top', '0px');

                            var top = parseInt(commentBox.txtNode.style.top);
                            domStyle.set(commentBox.txtNode, 'top', (top-commentBox._shift)+'px');
                            domStyle.set(commentBox.inputNode, 'top', (top-commentBox._shift)+'px');

                            commentBox._shift = null;
                        }

                        window.setTimeout(function(){
                            openShareDialog();
                        }, 300);

                    };

                }, 500);
            }
        }
        else
        {
            window.setTimeout(init, 20);
        }
    };

    document.addEventListener("backbutton", function(){
        navigator.app.exitApp();
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