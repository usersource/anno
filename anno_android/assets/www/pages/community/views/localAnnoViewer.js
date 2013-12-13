define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/json",
    "dojo/dom-style",
    "dojo/_base/connect",
    "dojo/window",
    "dijit/registry",
    "anno/common/Util",
    "anno/draw/Surface"
],
    function (dom, domClass, domConstruct, domGeom, dojoJson, domStyle, connect, win, registry, Util, Surface)
    {
        var _connectResults = []; // events connect results
        var app = null;
        var screenshotPath = "";
        var index = 0;
        var annoItemList;
        var surface;

        var showAnno = function()
        {
            var listItem = annoItemList.getChildren()[index];

            if (!listItem) return;

            var annoItem = listItem.annoItem;
            var viewPoint = win.getBox();

            if (annoItem.level == 1)
            {
                domStyle.set('screenshotContainer','borderColor', Util.level1Color);
            }
            else
            {
                domStyle.set('screenshotContainer','borderColor', Util.level2Color);
            }

            dom.byId('imageScreenshot').src = screenshotPath+"/"+annoItem.screenshot_key;

            var imageWidth = viewPoint.w, imageHeight = viewPoint.h,borderWidth = Math.floor(imageWidth*0.02);

            if (annoItem.anno_type == Util.annoType.DrawComment)
            {
                redrawShapes(annoItem);
            }
            else
            {
                redrawShapes(annoItem);
            }
        };

        var redrawShapes = function(annoItem)
        {
            var viewPoint = win.getBox();
            var imageWidth = viewPoint.w,imageHeight = viewPoint.h, borderWidth = Math.floor(imageWidth*0.02);
            var drawElements = annoItem.draw_elements;
            var lineStrokeStyle = {color: annoItem.level==1?Util.level1Color:Util.level2Color, width: 3};

            if (drawElements)
            {
                var elementsObject = dojoJson.parse(drawElements);

                surface.show();
                domStyle.set(surface.container, {'border': borderWidth+'px solid transparent', left:'0px',top:'0px'});

                surface.parse(elementsObject, lineStrokeStyle);

                console.error('redrawShapes end');
            }
            else
            {
                surface.clear();
                surface.show();

                var earLow = annoItem.direction==0||annoItem.direction=='false';
                domStyle.set(surface.container, {'border': borderWidth+'px solid transparent', left:'0px',top:'0px'});

                var toolTipDivWidth = (viewPoint.w-borderWidth*2-60),
                    pxPerChar = 8,
                    charsPerLine = toolTipDivWidth/pxPerChar;

                var commentText = annoItem.comment;
                var lines = Math.max(Math.round(commentText.length/charsPerLine),1);

                if (lines > 4 )
                {
                    lines = 4;
                    //var shortText = commentText.substr(0, charsPerLine*4-10)+"...";
                    //commentText = shortText;
                }

                var boxHeight = 34 + (lines-1)*22;
                var epLineStyle, epFillStyle;

                if (annoItem.level==1)
                {
                    epLineStyle = {color:'#FFA500', width:1};
                    epFillStyle = "rgba(255,165,0, 0.4)";
                }
                else
                {
                    epLineStyle = {color:'#FF0000',width:1};
                    epFillStyle = "rgba(255,12,9, 0.4)";
                }

                var tx = Math.round(((imageWidth-borderWidth*2)*annoItem.x)/10000);
                var ty = Math.round(((imageHeight-borderWidth*2)*annoItem.y)/10000);

                var commentBox = surface.createSimpleCommentBox({
                    deletable:false,
                    startX:tx,
                    startY: ty,
                    selectable:false,
                    shareBtnWidth:0,
                    boxHeight:boxHeight,
                    earLow:earLow,
                    placeholder:commentText,
                    commentText:annoItem.comment,
                    lineStrokeStyle:lineStrokeStyle,
                    endpointStrokeStyle:epLineStyle,
                    endpointFillStyle:epFillStyle
                });
            }

        };

        var adjustSize = function()
        {
            var viewPoint = win.getBox();
            var borderWidth = Math.floor(viewPoint.w*0.02);
            // set screenshot container size
            domStyle.set('screenshotContainer', {
                width: (viewPoint.w-borderWidth*2)+'px',
                height: (viewPoint.h-borderWidth*2)+'px',
                borderWidth:borderWidth+"px"
            });
        };

        var goNextRecord = function()
        {
            var listItemCnt = annoItemList.getChildren().length;

            if (index < (listItemCnt-1))
            {
                index+=1;
                showAnno();
            }
        };

        var goPreviousRecord = function()
        {
            if (index >= 1)
            {
                index-=1;
                showAnno();
            }
        };

        var startX, startY, startTouch;

        return {
            // simple view init
            init:function ()
            {
                annoItemList = registry.byId('annoListMyStuff');
                screenshotPath = Util.getAnnoScreenshotPath();

                var viewPoint = win.getBox();
                var borderWidth = Math.floor(viewPoint.w*0.02);

                surface = new Surface({
                    container: dom.byId("gfxCanvasContainerLocal"),
                    width:viewPoint.w-borderWidth*2,
                    height:viewPoint.h-borderWidth*2,
                    borderWidth:borderWidth
                });

                app = this.app;
                adjustSize();

                _connectResults.push(connect.connect(document.body, "touchstart", function (e)
                {
                    if( e.touches.length == 1 )
                    {
                        startTouch = true;
                        startX = e.touches[0].pageX;
                        startY = e.touches[0].pageY;
                    }
                }));

                _connectResults.push(connect.connect(document.body, "touchmove", function (e)
                {
                    if( e.touches.length == 1 &&startTouch)
                    {
                        var endX = e.touches[0].pageX;
                        var endY = e.touches[0].pageY;
                        if ((startX-endX) >=6 &&Math.abs(startY-endY)<10)
                        {
                            startTouch = false;
                            dojo.stopEvent(e);
                            goNextRecord();
                        }
                        else if ((startX-endX) <=-6 &&Math.abs(startY-endY)<10)
                        {
                            startTouch = false;
                            dojo.stopEvent(e);
                            goPreviousRecord();
                        }
                    }
                }));
            },
            afterActivate: function()
            {
                index = this.params["index"];
                if (index != null)
                {
                    showAnno();
                }
            },
            beforeDeactivate: function()
            {
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