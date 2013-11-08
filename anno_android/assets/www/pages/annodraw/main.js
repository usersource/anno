require([
    "anno/draw/Surface",
    "dojo/_base/connect",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/query",
    "dojo/ready",
    "dojo/touch",
    "dojo/window",
    "dijit/registry",
    "dojo/domReady!"
], function (Surface, connect, dom, domClass, domStyle, query, ready, touch, win, registry)
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
    });

    // share button
    connect.connect(dom.byId("btnShare"), 'click', function(e)
    {
        domStyle.set('bottomBarContainer', 'display', '');
        domStyle.set('bottomBarBlackContainer', 'display', 'none');
        registry.byId('shareDialog').hide();
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
        var rectangle = surface.createRectangle({
            startX: lastBlackRectanglePos.x1,
            startY: lastBlackRectanglePos.y1 - defaultShapeHeight - 50,
            width: defaultShapeWidth,
            height: defaultShapeHeight,
            lineStrokeStyle: {color: '#000000', width: 3},
            hiddenColor:"rgba(0, 0, 0, 1)"
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
    };

    var initBackgroundImage = function()
    {
        var scPath = window.ADActivity.getScreenshotPath();

        if (scPath)
        {
            console.error(scPath);
            document.body.style.backgroundImage = "url("+scPath+")";
        }
        else
        {
            window.setTimeout(initBackgroundImage, 50);
        }
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
        }, 500);
    };

    ready(init);

});