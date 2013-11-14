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
    "anno/common/Util",
    "anno/anno/AnnoDataHandler",
    "dojo/domReady!"
], function (Surface, connect, dom, domClass, domStyle, dojoJson, query, ready, touch, win, registry, annoUtil, AnnoDataHandler)
{
    var viewPoint,
        defaultShapeWidth = 160,
        defaultShapeHeight = 80,
        shareDialogGap = 80;

    var sdTitleHeight = 60,
        sdBottom = 80;

    var lastShapePos;
    var lastBlackRectanglePos;

    var surface;
    var defaultCommentBox;

    var selectedAppName, screenShotPath;

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

        var commentBox = surface.createCommentBox({startX:lastShapePos.x1, startY: lastShapePos.y1-defaultShapeHeight-50, width: defaultShapeWidth, height: defaultShapeHeight});
        updateLastShapePos('Rectangle');
    });

    connect.connect(dom.byId("barShare"), touch.release, function()
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
    });

    connect.connect(dom.byId("barBlackRectangle"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barBlackRectangle"), 'barIconDisabled2')) return;

        createBlackRectangle();
    });

    connect.connect(dom.byId("barBlackRectangleDone"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barBlackRectangle"), 'barIconDisabled')) return;

        domStyle.set('bottomBarContainer', 'display', '');
        domStyle.set('bottomBarBlackContainer', 'display', 'none');
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
        domStyle.set('bottomBarContainer', 'display', '');
        domStyle.set('bottomBarBlackContainer', 'display', 'none');
        registry.byId('shareDialog').hide();

        saveDrawCommentAnno();
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

    var switchMode = function(drawMode)
    {
        // remove default comment box
        surface.removeShape(defaultCommentBox);
        domStyle.set('bottomBarContainer', 'display', '');
        domStyle.set(dom.byId('btnHome'), 'display', 'none');
        domStyle.set(dom.byId('btnDraw'), 'display', 'none');

        // create default comment box
        var commentBox = surface.createCommentBox({deletable:false, startX:lastShapePos.x1, startY: lastShapePos.y1-defaultShapeHeight-50, width: defaultShapeWidth, height: defaultShapeHeight});
        updateLastShapePos('Rectangle');

        surface.switchMode(true);

        var hiddenCanvas = dom.byId('hiddenCanvas');
        hiddenCanvas.width = viewPoint.w;
        hiddenCanvas.height = viewPoint.h;
        var ctx = hiddenCanvas.getContext('2d');
        var hiddenImage = new Image();
        hiddenImage.onload = function()
        {
            ctx.drawImage(hiddenImage, 0, 0, viewPoint.w, viewPoint.h);
        };
        hiddenImage.src = screenShotPath;
    };

    var initBackgroundImage = function()
    {
        var scPath = window.ADActivity.getScreenshotPath();

        if (scPath)
        {
            console.error(scPath);
            screenShotPath = scPath;
            document.body.style.backgroundImage = "url("+scPath+")";
        }
        else
        {
            window.setTimeout(initBackgroundImage, 50);
        }
    };

    var saveSimpleCommentAnno = function()
    {
        annoUtil.showLoadingIndicator();

        var deviceInfo = annoUtil.getDeviceInfo();
        console.error(JSON.stringify(deviceInfo));

        var pluginParam = [];

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
                    "app_name":appInfo.appName,
                    "device_model":deviceInfo.model,
                    "os_name":deviceInfo.osName,
                    "os_version":deviceInfo.osVersion,
                    "anno_type":"Simple Comment",
                    "screenshot_is_anonymized":false
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
                    "anno_type":"Draw Comment"
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
        ctx.fillStyle = "black";

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
        initBackgroundImage();

        window.setTimeout(function(){

            viewPoint = win.getBox();

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
                width:viewPoint.w,
                height:viewPoint.h
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

            // set share dialog size
            domStyle.set('shareDialog', {
                width: (viewPoint.w-shareDialogGap)+'px',
                height: (viewPoint.h-shareDialogGap)+'px'
            });

            domStyle.set('sdTitle', 'height', sdTitleHeight+'px');
            domStyle.set('sdAppList', 'height', (viewPoint.h-sdTitleHeight-sdBottom-shareDialogGap)+'px');
            domStyle.set('sdBottom', 'height', sdBottom+'px');

            defaultCommentBox = surface.createSimpleCommentBox({deletable:false, startX:lastShapePos.x1, startY: lastShapePos.y1-defaultShapeHeight-50, width: defaultShapeWidth, height: defaultShapeHeight});

            connect.connect(defaultCommentBox.shareBtnNode, "click", function()
            {
                saveSimpleCommentAnno();
            });
        }, 500);
    };

    ready(init);

});