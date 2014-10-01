define([
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dnd/Moveable",
    "dojo/touch",
    "dojox/gesture/tap",
    "dojox/gfx",
    "dojox/gfx/shape",
    "dojox/gfx/move",
    "./BaseShape",
    "../../common/Util"
],
    function (declare, connect, lang, dom, domConstruct, domStyle, dojoMoveable, touch, tap, gfx, gfxShape, gfxMove, BaseShape, annoUtil)
    {
        /**
         * @author David Lee
         * CommentBox class
         */
        var EAR_DIRECTION = {
            TOP:0,
            TOP_LEFT:1,
            LEFT:2,
            LEFT_BOTTOM:3,
            BOTTOM:4,
            BOTTOM_RIGHT:5,
            RIGHT:6,
            RIGHT_BOTTOM:7,
            TOP_RIGHT:8
        };
        return declare("anno.draw.shapes.CommentBox", [BaseShape], {
            lineStrokeStyle: {color: '#000000', width: annoUtil.annotationWidth},
            shapeType: "CommentBox",
            minSize:44,
            shapePadding: 30,
            earHeight:22,
            earDistance: 24,
            boxHeight:30,
            earDirection:EAR_DIRECTION.TOP, // top
            placeholder:"Enter Suggestion Here",
            grayColor: "#A9A9A9",
            normalColor: "#000000",
            earGap:10,
            createShape: function (args)
            {
                this.createCommentBox(args);
                this.checkLevelColor(this.level);

                if (this.selectable)
                {
                    this.surface.selectShape(this);
                }
            },
            createCommentBox: function (args)
            {
                var circleR = this.circleR;
                var surface = this.surface.surface;
                var endPointFillStyle = this.endpointFillStyle,
                    endPointStrokeStyle = this.endpointStrokeStyle,
                    xColor = this.xColor;
                var comment = "";

                var pathPoints;

                if (args.shapeJson)
                {
                    if (args.shapeJson.ed != null)
                    {
                        this.earDirection = args.shapeJson.ed;
                    }

                    this.translateValues();

                    pathPoints = this._getBoxPointsPathByShapeJson();
                    endPointFillStyle = this.endpointHiddenStrokeStyle;
                    endPointStrokeStyle = this.endpointHiddenFillStyle;
                    xColor = this.xHiddenColor;
                    comment = args.shapeJson.comment;
                }
                else
                {
                    pathPoints = this._getBoxPointsPath();
                }

                this.path = surface.createPath(pathPoints.path).setStroke(this.lineStrokeStyle).setFill("#ffffff");
                this.path.isSelectTarget = true;
                this.path.sid = this.id;

                this.endpoint1 = surface.createCircle({cx: pathPoints.endpointsPos[0].x, cy: pathPoints.endpointsPos[0].y, r: circleR}).setStroke(endPointStrokeStyle).setFill(endPointFillStyle);
                this.endpoint2 = surface.createCircle({cx: pathPoints.endpointsPos[1].x, cy: pathPoints.endpointsPos[1].y, r: circleR}).setStroke(endPointStrokeStyle).setFill(endPointFillStyle);

                this.endpoint1.sid = this.id;
                this.endpoint2.sid = this.id;

                this.createX(pathPoints.xPos.x, pathPoints.xPos.y, xColor);
                this.x.sid = this.id;
                this.x.isX = true;

                // create text node
                this._createSVGForeignObject();
                this.txtNode.gfxTarget = {isSelectTarget:true, sid:this.id};
                //this.txtNode.children[0].gfxTarget = {isSelectTarget:true, sid:this.id};

                this.inputNode = domConstruct.create('div', {
                    style: "background-color:transparent;display:none;position:absolute;top:"+(this.pathPoints[0].y+3)+"px;left:"+(this.pathPoints[0].x+3)+"px;width:"+(this.pathPoints[5].x-this.pathPoints[0].x-6)+"px;height:"+(this.pathPoints[5].y-this.pathPoints[0].y-6)+"px",
                    innerHTML:"<textarea id='input_"+this.id+"' placeholder='Enter suggestion here' style='font-family: helvetica, arial;font-size: 13pt;font-weight: normal;background-color:transparent;width:100%;height:100%;border-color:transparent;outline: none;box-sizing: border-box;'></textarea>"
                }, this.surface.container, 'last');
                this.inputElement = dom.byId("input_"+this.id);

                // set comment text
                if (comment)
                {
                    if (this.shortText) comment = this.shortText;
                    var textDiv = dom.byId('textDiv_'+this.id);
                    dom.byId('textDiv_'+this.id).innerHTML = comment.replace(/\n/g, "<br>");
                    domStyle.set(textDiv, 'color', this.normalColor);

                    // If height of textDiv's parent is less than `this.earHeight` then text of textDiv
                    // is not properly visible at center of it because of higher font size
                    // So we are setting font-size if height of textDiv's parent is less
                    var textDivParentHeight = parseInt(textDiv.parentNode.style.height);
                    if (textDivParentHeight < this.earHeight) {
                        domStyle.set(textDiv, 'padding', '1px 3px');
                        domStyle.set(textDiv, 'font-size', (textDivParentHeight - 2) + "px");
                    }

                    this.inputElement.value = comment;
                }

                this._connects.push(connect.connect(this.inputElement, "blur", this, function (e)
                {
                    domStyle.set(this.txtNode, 'display', '');
                    domStyle.set(this.inputNode, 'display', 'none');

                    var textDiv = dom.byId('textDiv_'+this.id);
                    textDiv.innerHTML = this.inputElement.value.replace(/\n/g, "<br>");

                    if (this.inputElement.value.length <=0)
                    {
                        textDiv.innerHTML = this.placeholder;
                        domStyle.set(textDiv, 'color', this.grayColor);
                    }
                    else
                    {
                        domStyle.set(textDiv, 'color', this.normalColor);
                    }

                    dom.byId("hiddenBtn").focus();

                    if (this.onCommentBoxBlur)
                    {
                        this.onCommentBoxBlur(this);
                    }
                }));

                this._connects.push(connect.connect(this.inputElement, "keydown", this, function (e)
                {
                    if (e.keyCode == 13)
                    {
                        dojo.stopEvent(e);
                        this._closeKeyboard();
                    }

                    if (this.onCommentBoxKeyDown)
                    {
                        this.onCommentBoxKeyDown(this, e);
                    }
                }));

                this._connects.push(connect.connect(this.inputElement, "focus", this, function (e)
                {
                    if (this.onCommentBoxFocus)
                    {
                        this.onCommentBoxFocus(this);
                    }
                }));

                this._connects.push(connect.connect(this.inputElement, "input", this, function (e)
                {
                    if (this.onCommentBoxInput)
                    {
                        this.onCommentBoxInput(this, e);
                    }
                }));

                var ts = dojox.gfx.shape.Shape();
                ts.rawNode = this.txtNode;

                if (this.selectable)
                {
                    var commentBoxMover = new gfx.Moveable(ts);
                    connect.connect(commentBoxMover, "onMoved", this, function (mover, shift)
                    {
                        if (shift.dx != 0 || shift.dy !=0)
                            this._commentBoxMoveStopped = true;
                        if (this.isEndpointOutScreen(this.endpoint1, shift.dx, shift.dy)||this.isEndpointOutScreen(this.endpoint2, shift.dx, shift.dy)||this._isTopRightSideOutOfScreen(shift.dx, shift.dy))
                        {
                            return;
                        }

                        var top = parseInt(this.txtNode.getAttribute("y"));
                        this.txtNode.setAttribute("y", top+shift.dy);
                        this.inputNode.style.top = (top+shift.dy)+'px';
                        var left = parseInt(this.txtNode.getAttribute("x"));
                        this.txtNode.setAttribute("x", (left+shift.dx));
                        this.inputNode.style.left = (left+shift.dx)+'px';

                        this.path.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.endpoint1.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.endpoint2.applyTransform({dy: shift.dy, dx: shift.dx});

                        this.x.applyTransform({dy: shift.dy, dx: shift.dx});
                    });

                    var pathMover = new gfx.Moveable(this.path);
                    var endpoint1Mover = new gfx.Moveable(this.endpoint1);
                    var endpoint2Mover = new gfx.Moveable(this.endpoint2);

                    this._connects.push(connect.connect(pathMover, "onMoved", this, function (mover, shift)
                    {
                        if (this.isEndpointOutScreen(this.endpoint1, shift.dx, shift.dy)||this.isEndpointOutScreen(this.endpoint2, shift.dx, shift.dy)||this._isTopRightSideOutOfScreen(shift.dx, shift.dy))
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        this.endpoint1.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.endpoint2.applyTransform({dy: shift.dy, dx: shift.dx});

                        this.x.applyTransform({dy: shift.dy, dx: shift.dx});

                        var top = parseInt(this.txtNode.getAttribute("y"));
                        this.txtNode.setAttribute("y", (top+shift.dy));
                        this.inputNode.style.top = (top+shift.dy)+'px';
                        var left = parseInt(this.txtNode.getAttribute("x"));
                        this.txtNode.setAttribute("x", (left+shift.dx));
                        this.inputNode.style.left = (left+shift.dx)+'px';
                    }));

                    this._connects.push(connect.connect(endpoint1Mover, "onMoved", this, function (mover, shift)
                    {
                        if (!this.isMoveable())
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        if (this.isEndpointOutScreen(this.endpoint1, shift.dx, shift.dy)||!this._isEndpoint1Moveable(shift.dx, shift.dy))
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        var pathPoints = this._getBoxPointsPathForBTEndpointChange(shift.dx, shift.dy);

                        this.path.setShape(pathPoints.path);

                        var mdx = this.path.matrix?this.path.matrix.dx:0;

                        this.txtNode.setAttribute("x", this.pathPoints[0].x+3+mdx);
                        this.txtNode.setAttribute("width", (this.pathPoints[5].x-this.pathPoints[0].x-6));
                        this.txtNode.setAttribute("height", (this.pathPoints[5].y-this.pathPoints[0].y-6));

                        domStyle.set(this.txtDiv, {width:(this.pathPoints[5].x-this.pathPoints[0].x-6)+'px', height:(this.pathPoints[5].y-this.pathPoints[0].y-6)+'px'});
                        domStyle.set(this.inputNode, {left:(this.pathPoints[0].x+3+mdx)+'px', width:(this.pathPoints[5].x-this.pathPoints[0].x-6)+'px', height:(this.pathPoints[5].y-this.pathPoints[0].y-6)+'px'});
                    }));

                    this._connects.push(connect.connect(endpoint2Mover, "onMoved", this, function (mover, shift)
                    {
                        if (!this.isMoveable())
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        var pathPoints = this._getBoxPointsPathForEarChange(this.endpoint2, shift.dx, shift.dy);

                        if (pathPoints)
                            this.path.setShape(pathPoints.path);
                    }));

                    this._connects.push(connect.connect(endpoint2Mover, "onMoveStop", this, function (mover)
                    {
                        if (this._needRestoreLastEarPos)
                        {
                            this._restoreEarEndPoint();
                            this._needRestoreLastEarPos = false;
                        }
                    }));

                    this._connects.push(this.x.on(touch.release, lang.hitch(this, this.onXTouched)));

                    this._connects.push(connect.connect(this.txtNode, touch.release, this, function (e)
                    {
                        if (this._commentBoxMoveStopped)
                        {
                            if (!this.selected)
                            {
                                this.surface.selectShape(this);
                            }

                            this._commentBoxMoveStopped = false;
                        }
                        else
                        {
                            if (this.selected)
                            {
                                this._openKeyboard();
                            }
                            else
                            {
                                this.surface.selectShape(this);
                            }
                        }
                    }));
                }
            },
            _createSVGForeignObject: function()
            {
                var fo = document.createElementNS('http://www.w3.org/2000/svg', "foreignObject");
                fo.setAttribute('x', (this.pathPoints[0].x+3));
                fo.setAttribute('y', (this.pathPoints[0].y+3));
                fo.setAttribute('width', (this.pathPoints[5].x-this.pathPoints[0].x-6));
                fo.setAttribute('height', (this.pathPoints[5].y-this.pathPoints[0].y-6));

                var body = document.createElement("body");
                var txtDiv = document.createElement("div");

                domStyle.set(txtDiv,{
                    "background-color":"transparent",
                    width:(this.pathPoints[5].x-this.pathPoints[0].x-6)+"px",
                    height:(this.pathPoints[5].y-this.pathPoints[0].y-6)+"px"
                });

                txtDiv.innerHTML = "<div id='textDiv_"+this.id+"' style='padding:3px;overflow:hidden;width:100%;height:100%;box-sizing: border-box;font-weight: normal;color: "+this.grayColor+";'>"+this.placeholder+"</div>";

                fo.appendChild(body);
                body.appendChild(txtDiv);
                this.surface.container.children[0].appendChild(fo);

                this.txtNode = fo;
                this.txtDiv = txtDiv;

                this.txtRect = new gfxShape.Rect(fo);
                this.surface.surface.add(this.txtRect);
                this.txtRect._moveToFront = function()
                {
                    this.rawNode.parentNode.appendChild(this.rawNode);
                    return this;
                };

                this.txtRect._moveToBack = function(){
                    this.rawNode.parentNode.insertBefore(this.rawNode, this.rawNode.parentNode.firstChild);
                    return this;
                };

                this.txtRect._removeClipNode = function(){};
            },
            _openKeyboard: function(e)
            {
                domStyle.set(this.txtNode, 'display', 'none');
                domStyle.set(this.inputNode, 'display', '');

                this.inputElement.focus();
                this.inputElement.click();
                annoUtil.showSoftKeyboard("AnnoDraw");
            },
            _closeKeyboard: function(e)
            {
                domStyle.set(this.txtNode, 'display', '');
                domStyle.set(this.inputNode, 'display', 'none');

                this.inputElement.blur();
                dom.byId("hiddenBtn").focus();
                dom.byId("hiddenBtn").click();

                if (window.cordova&&cordova.exec)
                {
                    cordova.exec(
                        function (result)
                        {
                        },
                        function (err)
                        {
                            annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
                        },
                        "AnnoCordovaPlugin",
                        'close_softkeyboard',
                        []
                    );
                }
            },
            _getBoxPointsPath: function()
            {
                var vp = this.viewPoint;

                var boxWidth = vp.w - this.shapePadding*2;
                var leftX = this.shapePadding, rightX = vp.w - this.shapePadding;
                var leftY1  = this.startY + this.earHeight, leftY2 = this.startY + this.earHeight+this.boxHeight;

                var x2 = leftX + Math.round(boxWidth/2)-this.earDistance/2;
                var x3 = leftX + Math.round(boxWidth/2);
                var y3 = this.startY;
                var x4 = leftX + Math.round(boxWidth/2)+this.earDistance/2;

                var path = "M"+leftX+" "+leftY1 + " L"+x2+" "+leftY1+" L"+x3+" "+y3+" L"+x4+" "+leftY1+" L"+rightX+" "+leftY1+
                    " L"+rightX+" "+leftY2+" L"+leftX+" "+leftY2+ " L"+ leftX+" "+leftY1 + " Z";

                this.pathPoints = [
                    {x:leftX, y:leftY1},
                    {x:x2, y:leftY1},
                    {x:x3, y:y3},
                    {x:x4, y:leftY1},
                    {x:rightX, y:leftY1},
                    {x:rightX, y:leftY2},
                    {x:leftX, y:leftY2}
                ];

                return {
                    path: path,
                    endpointsPos:[
                        {x: leftX, y: leftY2},
                        {x: x3, y: y3},
                        {x: rightX, y: leftY1}],
                    xPos:{x: rightX-6, y:leftY1-40}
                };
            },
            _getBoxPointsPathForEarChange: function(ep, eX, eY)
            {
                var cp = this.pathPoints;

                var boundingBox = ep.getTransformedBoundingBox();

                var y1 = cp[0].y, y2 = cp[1].y, y3 = cp[2].y, y4 = cp[3].y, y5 = cp[4].y, y6 = cp[5].y, y7 = cp[6].y;
                var x1 = cp[0].x, x2 = cp[1].x, x3 = cp[2].x, x4 = cp[3].x, x5 = cp[4].x, x6 = cp[5].x, x7 = cp[6].x;

                var mdx = this.path.matrix?this.path.matrix.dx:0;
                var mdy = this.path.matrix?this.path.matrix.dy:0;

                x3 = boundingBox[0].x+(Math.round((boundingBox[1].x-boundingBox[0].x)/2))-mdx;
                y3 = boundingBox[0].y+(Math.round((boundingBox[2].y-boundingBox[0].y)/2))-mdy;

                var ed = this._getEarDirection(x3, y3, eX, eY), halfEar = this.earDistance/2;

                if (ed == EAR_DIRECTION.TOP)
                {
                    // top
                    x2 = cp[1].x = x3 - halfEar;
                    y2 = cp[1].y = y1;

                    x4 = cp[3].x = x3 + halfEar;
                    y4 = cp[3].y = y1;

                    x5 = cp[4].x = x6;
                    y5 = cp[4].y = y1;

                    x7 = cp[6].x = x1;
                    y7 = cp[6].y = y6;
                }
                else if (ed == EAR_DIRECTION.TOP_LEFT)
                {
                    // top-left
                    x2 = cp[1].x = x1 + this.earGap;
                    y2 = cp[1].y = y1;

                    x4 = cp[3].x = x2 + this.earDistance;
                    y4 = cp[3].y = y1;

                    x5 = cp[4].x = x6;
                    y5 = cp[4].y = y1;

                    x7 = cp[6].x = x1;
                    y7 = cp[6].y = y6;
                }
                else if (ed == EAR_DIRECTION.LEFT)
                {
                    // left
                    x2 = cp[1].x = x1;
                    y2 = cp[1].y = y3 - halfEar;

                    x4 = cp[3].x = x1;
                    y4 = cp[3].y = y3 + halfEar;

                    x5 = cp[4].x = x1;
                    y5 = cp[4].y = y6;

                    x7 = cp[6].x = x6;
                    y7 = cp[6].y = y1;
                }
                else if (ed == EAR_DIRECTION.LEFT_BOTTOM)
                {
                    // left-bottom
                    x2 = cp[1].x = x1;
                    y2 = cp[1].y = y6 - this.earDistance - this.earGap;

                    x4 = cp[3].x = x1;
                    y4 = cp[3].y = y6 - this.earGap;

                    x5 = cp[4].x = x1;
                    y5 = cp[4].y = y6;

                    x7 = cp[6].x = x6;
                    y7 = cp[6].y = y1;
                }
                else if (ed == EAR_DIRECTION.BOTTOM)
                {
                    // bottom
                    x2 = cp[1].x = x1;
                    y2 = cp[1].y = y6;

                    x4 = cp[3].x = x3;
                    y4 = cp[3].y = y3;

                    x5 = cp[4].x = x3 + halfEar;
                    y5 = cp[4].y = y6;

                    x3 = cp[2].x = x3 -halfEar;
                    y3 = cp[2].y = y6;

                    x7 = cp[6].x = x6;
                    y7 = cp[6].y = y1;
                }
                else if (ed == EAR_DIRECTION.RIGHT_BOTTOM)
                {
                    // bottom-right
                    x2 = cp[1].x = x1;
                    y2 = cp[1].y = y6;

                    x4 = cp[3].x = x3;
                    y4 = cp[3].y = y3;

                    x5 = cp[4].x = x6 - this.earGap;
                    y5 = cp[4].y = y6;

                    x3 = cp[2].x = x6 -this.earDistance - this.earGap;
                    y3 = cp[2].y = y6;

                    x7 = cp[6].x = x6;
                    y7 = cp[6].y = y1;
                }
                else if (ed == EAR_DIRECTION.RIGHT)
                {
                    // right
                    x2 = cp[1].x = x6;
                    y2 = cp[1].y = y1;

                    x4 = cp[3].x = x3;
                    y4 = cp[3].y = y3;

                    x5 = cp[4].x = x6;
                    y5 = cp[4].y = y3 + halfEar;

                    x3 = cp[2].x = x6;
                    y3 = cp[2].y = y3 - halfEar;

                    x7 = cp[6].x = x1;
                    y7 = cp[6].y = y6;
                }
                else if (ed == EAR_DIRECTION.TOP_RIGHT)
                {
                    // top-right
                    x2 = cp[1].x = x6 - this.earDistance - this.earGap;
                    y2 = cp[1].y = y1;

                    x4 = cp[3].x = x6 - this.earGap;
                    y4 = cp[3].y = y1;

                    x5 = cp[4].x = x6;
                    y5 = cp[4].y = y1;

                    x7 = cp[6].x = x1;
                    y7 = cp[6].y = y6;
                }

                if (ed >=0)
                {
                    cp[2].x = x3;
                    cp[2].y = y3;

                    var path = "M"+x1+" "+y1 + " L"+x2+" "+y2+" L"+x3+" "+y3+" L"+x4+" "+y4+" L"+x5+" "+y5+
                        " L"+x6+" "+y6+" L"+x7+" "+y7+ " L"+ x1+" "+y1 + " Z";

                    this.earDirection = ed;
                    this._needRestoreLastEarPos = false;

                    return {
                        path: path,
                        endpointsPos:[
                            {x: x1, y: y6},
                            {x: x3, y: y3}],
                        xPos:{x: x6-6, y:y1-40}
                    };
                }
                else
                {
                    this._needRestoreLastEarPos = true;
                }
            },
            _getEarDirection: function(earX, earY, dx, dy)
            {
                var d = -1;

                if (this.isEndpointOutScreen(this.endpoint2, dx, dy))
                {
                    return d;
                }

                var cp = this.pathPoints, tlX = cp[0].x, tlY = cp[0].y,
                    brX = cp[5].x, brY = cp[5].y;

                var halfEar = this.earDistance/ 2, earH = this.earHeight;

                if (earX >= (tlX+this.earGap+halfEar) && earX <= (brX-this.earGap-halfEar))
                {
                    if (earY <= (tlY-earH))
                    {
                        d = EAR_DIRECTION.TOP;
                    }
                    else if (earY > (brY+earH))
                    {
                        d = EAR_DIRECTION.BOTTOM;
                    }
                }
                else if (earX <=(tlX-earH))
                {
                    if (earY <= (tlY-earH))
                    {
                        d = EAR_DIRECTION.TOP_LEFT;
                    }
                    else if (earY > (brY+earH))
                    {
                        d = EAR_DIRECTION.LEFT_BOTTOM;
                    }
                    else if (earY > (tlY+halfEar+this.earGap) && earY < (brY-halfEar-this.earGap) )
                    {
                        d = EAR_DIRECTION.LEFT;
                    }
                }
                else if (earX >= (brX+halfEar+this.earGap))
                {
                    if (earY < (tlY-earH))
                    {
                        d = EAR_DIRECTION.TOP_RIGHT;
                    }
                    else if (earY > (brY+earH))
                    {
                        d = EAR_DIRECTION.RIGHT_BOTTOM;
                    }
                    else if (earY > (tlY+halfEar+this.earGap) && earY < (brY-halfEar-this.earGap))
                    {
                        d = EAR_DIRECTION.RIGHT;
                    }
                }

                return d;
            },
            _restoreEarEndPoint: function()
            {
                var ep = this.endpoint2, epx, epy, ed = this.earDirection, cp = this.pathPoints;

                if (ed == EAR_DIRECTION.TOP||ed == EAR_DIRECTION.TOP_LEFT||ed == EAR_DIRECTION.LEFT
                    ||ed == EAR_DIRECTION.LEFT_BOTTOM||ed == EAR_DIRECTION.LEFT_BOTTOM
                    ||ed == EAR_DIRECTION.TOP_RIGHT)
                {
                    epx = cp[2].x;
                    epy = cp[2].y;
                }
                else if (ed == EAR_DIRECTION.BOTTOM||ed == EAR_DIRECTION.RIGHT_BOTTOM
                    ||ed == EAR_DIRECTION.RIGHT||ed == EAR_DIRECTION.RIGHT)
                {
                    epx = cp[3].x;
                    epy = cp[3].y;
                }

                var boundingBox = ep.getTransformedBoundingBox();
                var mdx = this.path.matrix?this.path.matrix.dx:0;
                var mdy = this.path.matrix?this.path.matrix.dy:0;

                var x3 = boundingBox[0].x+(Math.round((boundingBox[1].x-boundingBox[0].x)/2))-mdx;
                var y3 = boundingBox[0].y+(Math.round((boundingBox[2].y-boundingBox[0].y)/2))-mdy;

                ep.applyTransform({dy: epy - y3, dx: epx - x3});
            },
            _getBoxPointsPathForBTEndpointChange: function(eX, eY)
            {
                var cp = this.pathPoints;
                var ed = this.earDirection;

                if (ed == EAR_DIRECTION.TOP||ed == EAR_DIRECTION.TOP_LEFT||ed == EAR_DIRECTION.TOP_RIGHT)
                {
                    cp[0].x = cp[6].x = cp[0].x + eX;
                    cp[5].y = cp[6].y = cp[5].y + eY;
                }
                else if (ed == EAR_DIRECTION.LEFT||ed == EAR_DIRECTION.LEFT_BOTTOM)
                {
                    cp[0].x = cp[4].x = cp[0].x + eX;
                    cp[1].x = cp[3].x = cp[1].x + eX;

                    cp[4].y = cp[5].y= cp[4].y+eY;
                }
                else if (ed == EAR_DIRECTION.BOTTOM||ed == EAR_DIRECTION.RIGHT_BOTTOM)
                {
                    cp[0].x = cp[1].x = cp[0].x + eX;

                    cp[1].y = cp[5].y= cp[1].y+eY;
                    cp[2].y = cp[4].y= cp[2].y+eY;
                }
                else if (ed == EAR_DIRECTION.RIGHT)
                {
                    cp[0].x = cp[6].x = cp[0].x + eX;

                    cp[6].y = cp[5].y= cp[5].y+eY;
                }

                var y1 = cp[0].y, y2 = cp[1].y, y3 = cp[2].y, y4 = cp[3].y, y5 = cp[4].y, y6 = cp[5].y, y7 = cp[6].y;
                var x1 = cp[0].x, x2 = cp[1].x, x3 = cp[2].x, x4 = cp[3].x, x5 = cp[4].x, x6 = cp[5].x, x7 = cp[6].x;

                var path = "M"+x1+" "+y1 + " L"+x2+" "+y2+" L"+x3+" "+y3+" L"+x4+" "+y4+" L"+x5+" "+y5+
                    " L"+x6+" "+y6+" L"+x7+" "+y7+ " L"+ x1+" "+y1 + " Z";

                return {
                    path: path,
                    endpointsPos:[
                        {x: x1, y: y6},
                        {x: x3, y: y3}],
                    xPos:{x: x6-6, y:y1-40}
                };
            },
            _getBoxPointsPathByShapeJson: function()
            {
                var cp = this.pathPoints = this.shapeJson.points;

                var y1 = cp[0].y, y2 = cp[1].y, y3 = cp[2].y, y4 = cp[3].y, y5 = cp[4].y, y6 = cp[5].y, y7 = cp[6].y;
                var x1 = cp[0].x, x2 = cp[1].x, x3 = cp[2].x, x4 = cp[3].x, x5 = cp[4].x, x6 = cp[5].x, x7 = cp[6].x;

                var path = "M"+x1+" "+y1 + " L"+x2+" "+y2+" L"+x3+" "+y3+" L"+x4+" "+y4+" L"+x5+" "+y5+
                    " L"+x6+" "+y6+" L"+x7+" "+y7+ " L"+ x1+" "+y1 + " Z";

                return {
                    path: path,
                    endpointsPos:[
                        {x: x1, y: y6},
                        {x: x3, y: y3}],
                    xPos:{x: x6-6, y:y1-40}
                };
            },
            _isEarMoveable: function(dx, dy)
            {
                return true;
            },
            _isTopRightSideOutOfScreen:function(dx, dy)
            {
                var mdx = 0, mdy = 0;
                if (this.path.matrix)
                {
                    mdx = this.path.matrix.dx||0;
                    mdy = this.path.matrix.dy||0;
                }

                var cp = this.pathPoints, topX = cp[5].x, topY, ed = this.earDirection;

                if (ed == EAR_DIRECTION.TOP||ed == EAR_DIRECTION.TOP_LEFT||ed == EAR_DIRECTION.TOP_RIGHT)
                {
                    topY = cp[4].y;
                }
                else if (ed == EAR_DIRECTION.LEFT||ed == EAR_DIRECTION.LEFT_BOTTOM)
                {
                    topY = cp[6].y;
                }
                else if (ed == EAR_DIRECTION.BOTTOM||ed == EAR_DIRECTION.RIGHT_BOTTOM)
                {
                    topY = cp[6].y;
                }
                else if (ed == EAR_DIRECTION.RIGHT)
                {
                    topY = cp[1].y;
                }

                var vp = this.viewPoint;

                topX = topX + mdx + dx + this.circleR;
                topY = topY + mdy + dy - this.circleR;
                if (topX >= vp.w)
                {
                    return true;
                }

                if (topY < 1)
                {
                    return true;
                }

                return false;
            },
            _isEndpoint1Moveable: function(dx, dy)
            {
                var cp = this.pathPoints;
                var ed = this.earDirection;

                if (ed == EAR_DIRECTION.TOP||ed == EAR_DIRECTION.TOP_LEFT||ed == EAR_DIRECTION.TOP_RIGHT)
                {
                    if ((cp[0].x + dx + this.earGap) >= cp[1].x)
                    {
                        return false;
                    }

                    if ((cp[5].y - cp[0].y + dy) >= (this.boxHeight*3) || (cp[5].y - cp[0].y + dy) < this.boxHeight)
                    {
                        return false;
                    }
                }
                else if (ed == EAR_DIRECTION.LEFT||ed == EAR_DIRECTION.LEFT_BOTTOM)
                {
                    if ((cp[0].x + dx - cp[2].x) <= this.earHeight)
                    {
                        return false;
                    }

                    if ((cp[5].y + dy - cp[3].y) <= this.earGap)
                    {
                        return false;
                    }

                    if ((cp[5].y - cp[0].y + dy) >= (this.boxHeight*3) || (cp[5].y - cp[0].y + dy) < this.boxHeight)
                    {
                        return false;
                    }
                }
                else if (ed == EAR_DIRECTION.BOTTOM||ed == EAR_DIRECTION.RIGHT_BOTTOM)
                {
                    if ((cp[3].y + dy - cp[5].y) <= this.earHeight)
                    {
                        return false;
                    }

                    if ((cp[2].x - (cp[1].x + dx) ) <= this.earGap)
                    {
                        return false;
                    }

                    if ((cp[5].y - cp[0].y + dy) >= (this.boxHeight*3) || (cp[5].y - cp[0].y + dy) < this.boxHeight)
                    {
                        return false;
                    }
                }
                else if (ed == EAR_DIRECTION.RIGHT)
                {
                    if ((cp[3].x - (cp[5].x+dx)) <= this.earHeight)
                    {
                        return false;
                    }

                    if ((cp[5].y - cp[0].y + dy) >= (this.boxHeight*3) || (cp[5].y - cp[0].y + dy) < this.boxHeight)
                    {
                        return false;
                    }

                    if ((cp[5].y - cp[4].y + dy) <= this.earGap)
                    {
                        return false;
                    }
                }

                if (dx != 0)
                {
                    var boxWidth = cp[5].x - cp[0].x - dx;

                    if (boxWidth < this.viewPoint.w/3)
                    {
                        return false;
                    }
                }


                return true;
            },
            destroy: function ()
            {
                this.inherited(arguments);

                var surface = this.surface.surface;

                surface.remove(this.path);
                surface.remove(this.endpoint1);
                surface.remove(this.endpoint2);
                surface.remove(this.txtRect);

                domConstruct.destroy(this.inputNode);
            },
            setSelected: function (sel)
            {
                this.inherited(arguments);
                if (!this.selectable) return;

                if (sel)
                {
                    this.endpoint1.setStroke(this.endpointStrokeStyle).setFill(this.endpointFillStyle);
                    this.endpoint2.setStroke(this.endpointStrokeStyle).setFill(this.endpointFillStyle);
                }
                else
                {
                    this.endpoint1.setStroke(this.endpointHiddenStrokeStyle).setFill(this.endpointHiddenFillStyle);
                    this.endpoint2.setStroke(this.endpointHiddenStrokeStyle).setFill(this.endpointHiddenFillStyle);

                    this._closeKeyboard();

                    var textDiv = dom.byId('textDiv_'+this.id);
                    textDiv.innerHTML = this.inputElement.value.replace(/\n/g, "<br>");

                    if (this.inputElement.value.length <=0)
                    {
                        textDiv.innerHTML = this.placeholder;
                        domStyle.set(textDiv, 'color', this.grayColor);
                    }
                    else
                    {
                        domStyle.set(textDiv, 'color', this.normalColor);
                    }
                }
            },
            moveToFront: function()
            {
                this.path.moveToFront();
                this.txtRect.moveToFront();
                this.endpoint1.moveToFront();
                this.endpoint2.moveToFront();

                this.inherited(arguments);
            },
            setId: function (id)
            {
                this.inherited(arguments);
            },
            getComment:function()
            {
                return this.inputElement.value;
            },
            toJSON: function()
            {
                var ps = lang.clone(this.pathPoints);

                if (this.path.matrix)
                {
                    var dx = this.path.matrix.dx||0;
                    var dy = this.path.matrix.dy||0;

                    for (var i= 0,c=ps.length;i<c;i++)
                    {
                        ps[i].x += dx;
                        ps[i].y += dy;
                    }
                }

                // convert all values into relative values
                for (var i= 0,c=ps.length;i<c;i++)
                {
                    ps[i].x = this.toRelativeValue(ps[i].x, true);
                    ps[i].y = this.toRelativeValue(ps[i].y, false);
                }

                return {type:this.shapeType, points:ps, comment:this.inputElement.value, ed:this.earDirection};
            },
            translateValues:function()
            {
                var ps = this.shapeJson.points;

                // convert all relative values into real values
                for (var i= 0,c=ps.length;i<c;i++)
                {
                    ps[i].x = this.translateValue(ps[i].x, true);
                    ps[i].y = this.translateValue(ps[i].y, false);
                }

                // check the ear height and distance
                // check the box height and make sure it's should be up to 4 lines height
                var ed = this.earDirection, boxWidth = ps[5].x - ps[0].x;
                var lines = this._getLines(boxWidth), boxHeight = this.boxHeight + (lines-1)*20, tboxHeight;

                if (ed == EAR_DIRECTION.TOP||ed == EAR_DIRECTION.TOP_LEFT||ed == EAR_DIRECTION.TOP_RIGHT)
                {
                    if ((ps[3].x - ps[1].x) < this.earDistance)
                    {
                        var dx = Math.round((this.earDistance-(ps[3].x - ps[1].x))/2);

                        if ((ps[3].x + dx + this.earGap) > ps[4].x)
                        {
                            ps[1].x = ps[1].x - 2*dx;
                        }
                        else
                        {
                            ps[1].x = ps[1].x - dx;
                            ps[3].x = ps[3].x + dx;
                        }
                    }
                    else if ((ps[3].x - ps[1].x) > this.earDistance)
                    {
                        var dx = Math.round(((ps[3].x - ps[1].x)-this.earDistance)/2);
                        ps[1].x = ps[1].x + dx;
                        ps[3].x = ps[3].x - dx;
                    }

                    if ((ps[0].y-ps[2].y) <this.earHeight)
                    {
                        var dy = this.earHeight - (ps[0].y-ps[2].y);

                        ps[0].y += dy;
                        ps[1].y += dy;
                        ps[3].y += dy;
                        ps[4].y += dy;
                        ps[5].y += dy;
                        ps[6].y += dy;
                    }

                    ps[5].y = ps[6].y = ps[0].y + boxHeight;

                    // fix the x7, x5 error value generated in previously version
                    if (ps[6].x != ps[0].x)
                    {
                        ps[6].x = ps[0].x;
                    }

                    if (ps[4].x != ps[5].x)
                    {
                        ps[4].x = ps[5].x;
                    }
                }
                else if (ed == EAR_DIRECTION.LEFT||ed == EAR_DIRECTION.LEFT_BOTTOM)
                {
                    if ((ps[3].y - ps[1].y) < this.earDistance)
                    {
                        var dy = Math.round((this.earDistance-(ps[3].y - ps[1].y))/2);
                        ps[1].y = ps[1].y - dy;
                        ps[3].y = ps[3].y + dy;
                    }
                    else if ((ps[3].y - ps[1].y) > this.earDistance)
                    {
                        var dy = Math.round(((ps[3].y - ps[1].y)-this.earDistance)/2);
                        ps[1].y = ps[1].y + dy;
                        ps[3].y = ps[3].y - dy;
                    }

                    if ((ps[0].x-ps[2].x) <this.earHeight)
                    {
                        var dx = this.earHeight - (ps[0].x-ps[2].x);

                        ps[0].x += dx;
                        ps[1].x += dx;
                        ps[3].x += dx;
                        ps[4].x += dx;
                        ps[5].x += dx;
                        ps[6].x += dx;
                    }

                    if (lines == 1)
                    {
                        boxHeight = this.boxHeight +10;
                    }

                    tboxHeight = ps[5].y - ps[0].y; // translated box height

                    if (tboxHeight > boxHeight)
                    {
                        dy = tboxHeight - boxHeight;

                        if ((ps[1].y - dy - ps[0].y) < this.earGap)
                        {
                            dy = dy - (this.earGap - (ps[1].y - dy - ps[0].y));

                            ps[1].y -= dy;
                            ps[3].y -= dy;
                        }
                        else if ((ps[0].y+boxHeight - (ps[3].y-dy)) < this.earGap)
                        {
                            var gap = (this.earGap - (ps[0].y+boxHeight - (ps[3].y-dy)));
                            dy = dy + gap;

                            ps[1].y -= dy;
                            ps[3].y -= dy;
                        }
                        else
                        {
                            ps[1].y -= dy;
                            ps[3].y -= dy;
                        }
                    }

                    ps[4].y = ps[5].y = ps[0].y + boxHeight;
                }
                else if (ed == EAR_DIRECTION.BOTTOM||ed == EAR_DIRECTION.RIGHT_BOTTOM)
                {
                    if ((ps[4].x - ps[2].x) < this.earDistance)
                    {
                        var dx = Math.round((this.earDistance-(ps[4].x - ps[2].x))/2);

                        if ((ps[4].x + dx + this.earGap) > ps[5].x)
                        {
                            ps[2].x = ps[2].x - 2*dx;
                        }
                        else
                        {
                            ps[2].x = ps[2].x - dx;
                            ps[4].x = ps[4].x + dx;
                        }
                    }
                    else if ((ps[4].x - ps[2].x) > this.earDistance)
                    {
                        var dx = Math.round(((ps[4].x - ps[2].x)-this.earDistance)/2);
                        ps[2].x = ps[2].x + dx;
                        ps[4].x = ps[4].x - dx;
                    }

                    if ((ps[3].y-ps[5].y) <this.earHeight)
                    {
                        var dy = this.earHeight - (ps[3].y-ps[5].y);

                        ps[0].y -= dy;
                        ps[1].y -= dy;
                        ps[2].y -= dy;
                        ps[4].y -= dy;
                        ps[5].y -= dy;
                        ps[6].y -= dy;
                    }

                    ps[1].y = ps[2].y = ps[4].y = ps[5].y = ps[0].y + boxHeight;
                }
                else if (ed == EAR_DIRECTION.RIGHT)
                {
                    if ((ps[4].y - ps[2].y) < this.earDistance)
                    {
                        var dy = Math.round((this.earDistance-(ps[4].y - ps[2].y))/2);
                        ps[2].y = ps[2].y - dy;
                        ps[4].y = ps[4].y + dy;
                    }
                    else if ((ps[4].y - ps[2].y) > this.earDistance)
                    {
                        var dy = Math.round(((ps[4].y - ps[2].y)-this.earDistance)/2);
                        ps[2].y = ps[2].y + dy;
                        ps[4].y = ps[4].y - dy;
                    }

                    if ((ps[3].x-ps[5].x) <this.earHeight)
                    {
                        var dx = this.earHeight - (ps[3].x-ps[5].x);

                        ps[0].x -= dx;
                        ps[1].x -= dx;
                        ps[2].x -= dx;
                        ps[4].x -= dx;
                        ps[5].x -= dx;
                        ps[6].x -= dx;
                    }

                    if (lines == 1)
                    {
                        boxHeight = this.boxHeight +10;
                    }

                    tboxHeight = ps[5].y - ps[0].y; // translated box height

                    if (tboxHeight > boxHeight)
                    {
                        dy = tboxHeight - boxHeight;

                        if ((ps[2].y - dy - ps[1].y) < this.earGap)
                        {
                            dy = dy - (this.earGap - (ps[2].y - dy - ps[1].y));

                            ps[2].y -= dy;
                            ps[4].y -= dy;
                        }
                        else if ((ps[0].y+boxHeight - (ps[4].y-dy)) < this.earGap)
                        {
                            dy = dy + (this.earGap - (ps[0].y+boxHeight - (ps[4].y-dy)));

                            ps[2].y -= dy;
                            ps[4].y -= dy;
                        }
                        else
                        {
                            ps[2].y -= dy;
                            ps[4].y -= dy;
                        }
                    }

                    ps[5].y = ps[6].y = ps[0].y + boxHeight;
                }

            },
            _getLines: function(boxWidth)
            {
                var pxPerChar = 8,
                    charsPerLine = boxWidth/pxPerChar;

                var commentText = this.shapeJson.comment;
                var lines = Math.max(Math.round(commentText.length/charsPerLine),1);

                if (lines > 4 )
                {
                    lines = 4;
                }

                return lines;
            },
            animateEarControl: function()
            {
                var vp = this.viewPoint;
                var dist = Math.round((vp.w - this.shapePadding*2)*0.3), mdist = 0, step = 10;

                var self = this;
                var intervalHandle = window.setInterval(function(){
                    var ep = self.endpoint2;
                    ep.applyTransform({dx: step});
                    var pathPoints = self._getBoxPointsPathForEarChange(ep, 2, 0);

                    if (pathPoints)
                        self.path.setShape(pathPoints.path);

                    mdist +=step;

                    if (mdist >= dist)
                    {
                        step = - step;
                    }

                    if (mdist<=0)
                    {
                        window.clearInterval(intervalHandle);
                    }

                }, 50);
            },
            checkLevelColor: function(level) {
                if (level == 2) {
                    var levelColor = annoUtil.level2ColorRGB;
                    this.endpointStrokeStyle = "rgba(" + levelColor + ", 1)";
                    this.endpointFillStyle = "rgba(" + levelColor + ", 0.5)";
                    this.endpointHiddenStrokeStyle = "rgba(" + levelColor + ", 0)";
                    this.endpointHiddenFillStyle = "rgba(" + levelColor + ", 0)";
                    this.xColor = "rgba(" + levelColor + ", 1)";
                }
            }
        });
    });
