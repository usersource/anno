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
        var circleRadius = 16;

        var showAnno = function()
        {
            var listItem = annoItemList.getChildren()[index];

            if (!listItem) return;

            var annoItem = listItem.annoItem;
            var viewPoint = win.getBox(), annoTooltipY;
            var tooltipWidget = registry.byId('textTooltipLocal');

            if (annoItem.level == 1)
            {
                domStyle.set('screenshotContainer','borderColor', Util.level1Color);
                drawOrangeCircle(1);
            }
            else
            {
                domStyle.set('screenshotContainer','borderColor', Util.level2Color);
                drawOrangeCircle(2);
            }

            dom.byId('imageScreenshot').src = screenshotPath+"/"+annoItem.screenshot_key;
            dom.byId('screenshotTooltipLocal').innerHTML = annoItem.comment;

            var imageWidth = viewPoint.w, imageHeight = viewPoint.h,borderWidth = Math.floor(imageWidth*0.02);

            if (annoItem.anno_type == Util.annoType.DrawComment)
            {
                tooltipWidget.hide();
                domStyle.set("screenshotAnchorLocal", "display", "none");
                redrawShapes(annoItem);
            }
            else
            {
                surface.clear();
                surface.hide();

                var toolTipDivWidth = (viewPoint.w-viewPoint.w*0.10),
                    pxPerChar = 8,
                    charsPerLine = toolTipDivWidth/pxPerChar;

                if (annoItem.comment.length >= charsPerLine*3)
                {
                    var shortText = annoItem.comment.substr(0, charsPerLine*3-3)+"...";

                    dom.byId('screenshotTooltipLocal').innerHTML = shortText;
                }

                if (annoItem.x != null)
                {
                    var tx = Math.round(((imageWidth-borderWidth*2)*annoItem.x)/10000) -circleRadius+8;
                    var ty = Math.round(((imageHeight-borderWidth*2)*annoItem.y)/10000) -circleRadius+8;

                    domStyle.set("screenshotAnchorLocal", {
                        top: ty+'px',
                        left: tx+'px',
                        display: ''
                    });

                    domStyle.set("screenshotAnchorInvisibleLocal", {
                        top: ty+'px'
                    });

                    if (ty > (domStyle.get("screenshotTooltipLocal", "height")+14))
                    {
                        tooltipWidget.show(dom.byId('screenshotAnchorInvisibleLocal'), ['above-centered','below-centered','before','after']);
                        annoTooltipY = parseInt(domStyle.get(tooltipWidget.domNode, 'top'))+14;
                        domStyle.set(tooltipWidget.domNode, 'top', annoTooltipY+'px');
                    }
                    else
                    {
                        tooltipWidget.show(dom.byId('screenshotAnchorInvisibleLocal'), ['below-centered','below-centered','after','before']);
                        annoTooltipY = parseInt(domStyle.get(tooltipWidget.domNode, 'top'))-14;
                        domStyle.set(tooltipWidget.domNode, 'top', annoTooltipY+'px');
                    }

                    var pos = domGeom.position("screenshotAnchorLocal", true);
                    var tpLeft = domStyle.get(tooltipWidget.domNode, 'left');
                    domStyle.set(tooltipWidget.anchor, {
                        left: (pos.x-tpLeft+2)+'px'
                    });
                }
                else
                {
                    domStyle.set("screenshotAnchorLocal", "display", "none");
                    tooltipWidget.show(dom.byId('screenshotDefaultAnchorLocal'), ['below-centered','below-centered','after','before']);
                    annoTooltipY = parseInt(domStyle.get(tooltipWidget.domNode, 'top'))-14;
                    domStyle.set(tooltipWidget.domNode, 'top', annoTooltipY+'px');
                }
            }
        };

        var redrawShapes = function(annoItem)
        {
            var viewPoint = win.getBox();
            var imageWidth = viewPoint.w, borderWidth = Math.floor(imageWidth*0.02);
            var drawElements = annoItem.draw_elements;
            if (drawElements)
            {
                console.error('redrawShapes:'+drawElements);
                var elementsObject = dojoJson.parse(drawElements);

                surface.show();
                domStyle.set(surface.container, {'border': borderWidth+'px solid transparent', left:'0px',top:'0px'});

                //surface.borderWidth = borderWidth;
                //surface.setDimensions(imageWidth-borderWidth*2, imageHeight-borderWidth*2);

                surface.parse(elementsObject);

                console.error('redrawShapes end');
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

            domStyle.set("screenshotTooltipLocal", "width", (viewPoint.w-viewPoint.w*0.10)+"px");
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

            var ctx = dom.byId('screenshotAnchorLocal').getContext('2d');
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
                registry.byId('textTooltipLocal').hide();
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