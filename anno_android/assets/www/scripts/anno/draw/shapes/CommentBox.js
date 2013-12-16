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
    "dojox/gfx/move",
    "./BaseShape"
],
    function (declare, connect, lang, dom, domConstruct, domStyle, dojoMoveable, touch, tap, gfx, gfxMove, BaseShape)
    {
        /**
         * @author David Lee
         * CommentBox class
         */
        return declare("anno.draw.shapes.CommentBox", [BaseShape], {
            lineStrokeStyle: {color: '#000000', width: 3},
            shapeType: "CommentBox",
            minSize:44,
            shapePadding: 30,
            earHeight:34,
            earDistance: 44,
            boxHeight:34,
            placeholder:"Enter suggestion here",
            grayColor: "#A9A9A9",
            normalColor: "#000000",
            createShape: function (args)
            {
                this.createCommentBox(args);
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
                this.endpoint3 = surface.createCircle({cx: pathPoints.endpointsPos[2].x, cy: pathPoints.endpointsPos[2].y, r: circleR}).setStroke(endPointStrokeStyle).setFill(endPointFillStyle);
                this.endpoint1.sid = this.id;
                this.endpoint2.sid = this.id;
                this.endpoint3.sid = this.id;

                this.x = surface.createText({x: pathPoints.xPos.x, y: pathPoints.xPos.y, text: "x", align: "middle"}).setFont(this.xFont).setStroke(xColor).setFill(xColor);
                this.x.sid = this.id;
                this.x.isX = true;

                // create text node
                this.txtNode = domConstruct.create('div', {
                    style: "background-color:transparent;position:absolute;top:"+(this.pathPoints[0].y+3+this.surface.borderWidth)+"px;left:"+(this.pathPoints[0].x+3+this.surface.borderWidth)+"px;width:"+(this.pathPoints[4].x-this.pathPoints[0].x-6)+"px;height:"+(this.pathPoints[5].y-this.pathPoints[0].y-6)+"px",
                    innerHTML:"<div id='textDiv_"+this.id+"' style='padding:3px;overflow:hidden;width:100%;height:100%;box-sizing: border-box;font-weight: normal;color: "+this.grayColor+";'>"+this.placeholder+"</div>"
                }, document.body, 'last');

                this.txtNode.gfxTarget = {isSelectTarget:true, sid:this.id};
                this.txtNode.children[0].gfxTarget = {isSelectTarget:true, sid:this.id};

                this.inputNode = domConstruct.create('div', {
                    style: "background-color:transparent;display:none;position:absolute;top:"+(this.pathPoints[0].y+3+this.surface.borderWidth)+"px;left:"+(this.pathPoints[0].x+3+this.surface.borderWidth)+"px;width:"+(this.pathPoints[4].x-this.pathPoints[0].x-6)+"px;height:"+(this.pathPoints[5].y-this.pathPoints[0].y-6)+"px",
                    innerHTML:"<textarea id='input_"+this.id+"' placeholder='Enter suggestion here' style='font-family: helvetica, arial;font-size: 13pt;font-weight: normal;background-color:transparent;width:100%;height:100%;border-color:transparent;outline: none;'></textarea>"
                }, document.body, 'last');
                this.inputElement = dom.byId("input_"+this.id);

                // set comment text
                if (comment)
                {
                    if (this.shortText) comment = this.shortText;
                    var textDiv = dom.byId('textDiv_'+this.id);
                    dom.byId('textDiv_'+this.id).innerHTML = comment.replace(/\n/g, "<br>");
                    domStyle.set(textDiv, 'color', this.normalColor);

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
                }));

                this._connects.push(connect.connect(this.inputElement, "keydown", this, function (e)
                {
                    if (e.keyCode == 13)
                    {
                        dojo.stopEvent(e);
                        this._closeKeybord();
                    }
                }));

                var ts = dojox.gfx.shape.Shape();
                ts.rawNode = this.txtNode;

                if (this.selectable)
                {
                    var commentBoxMover = new gfx.Moveable(ts);
                    connect.connect(commentBoxMover, "onMoved", this, function (mover, shift)
                    {
                        if (this.isEndpointOutScreen(this.endpoint1, shift.dx, shift.dy)||this.isEndpointOutScreen(this.endpoint2, shift.dx, shift.dy)||this.isEndpointOutScreen(this.endpoint3, shift.dx, shift.dy))
                        {
                            return;
                        }

                        var top = parseInt(this.txtNode.style.top);
                        this.txtNode.style.top = (top+shift.dy)+'px';
                        this.inputNode.style.top = (top+shift.dy)+'px';
                        var left = parseInt(this.txtNode.style.left);
                        this.txtNode.style.left = (left+shift.dx)+'px';
                        this.inputNode.style.left = (left+shift.dx)+'px';

                        this.path.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.endpoint1.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.endpoint2.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.endpoint3.applyTransform({dy: shift.dy, dx: shift.dx});

                        this.x.applyTransform({dy: shift.dy, dx: shift.dx});
                    });

                    var pathMover = new gfx.Moveable(this.path);
                    var endpoint1Mover = new gfx.Moveable(this.endpoint1);
                    var endpoint2Mover = new gfx.Moveable(this.endpoint2);
                    var endpoint3Mover = new gfx.Moveable(this.endpoint3);

                    this._connects.push(connect.connect(pathMover, "onMoved", this, function (mover, shift)
                    {
                        if (this.isEndpointOutScreen(this.endpoint1, shift.dx, shift.dy)||this.isEndpointOutScreen(this.endpoint2, shift.dx, shift.dy)||this.isEndpointOutScreen(this.endpoint3, shift.dx, shift.dy))
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        this.endpoint1.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.endpoint2.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.endpoint3.applyTransform({dy: shift.dy, dx: shift.dx});

                        this.x.applyTransform({dy: shift.dy, dx: shift.dx});

                        var top = parseInt(this.txtNode.style.top);
                        this.txtNode.style.top = (top+shift.dy)+'px';
                        this.inputNode.style.top = (top+shift.dy)+'px';
                        var left = parseInt(this.txtNode.style.left);
                        this.txtNode.style.left = (left+shift.dx)+'px';
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
                        domStyle.set(this.txtNode, {left:(this.pathPoints[0].x+3+mdx+this.surface.borderWidth)+'px', width:(this.pathPoints[4].x-this.pathPoints[0].x-6)+'px', height:(this.pathPoints[5].y-this.pathPoints[0].y-6)+'px'});
                        domStyle.set(this.inputNode, {left:(this.pathPoints[0].x+3+mdx+this.surface.borderWidth)+'px', width:(this.pathPoints[4].x-this.pathPoints[0].x-6)+'px', height:(this.pathPoints[5].y-this.pathPoints[0].y-6)+'px'});
                    }));

                    this._connects.push(connect.connect(endpoint2Mover, "onMoved", this, function (mover, shift)
                    {
                        if (!this.isMoveable())
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        if (this.isEndpointOutScreen(this.endpoint2, shift.dx, shift.dy)||!this._isEarMoveable(shift.dx, shift.dy))
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        var pathPoints = this._getBoxPointsPathForEarChange(this.endpoint2, shift.dx, shift.dy);

                        this.path.setShape(pathPoints.path);
                    }));

                    this._connects.push(connect.connect(endpoint3Mover, "onMoved", this, function (mover, shift)
                    {
                        if (!this.isMoveable())
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        if (this.isEndpointOutScreen(this.endpoint3, shift.dx, shift.dy)||!this._isEndpoint3Moveable(shift.dx, shift.dy))
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        var pathPoints = this._getBoxPointsPathForUREndpointChange(shift.dx, shift.dy);

                        this.path.setShape(pathPoints.path);
                        this.x.applyTransform({dy: shift.dy, dx: shift.dx});

                        var mdy = this.path.matrix?this.path.matrix.dy: 0;
                        domStyle.set(this.txtNode, {top:(this.pathPoints[0].y+3+mdy+this.surface.borderWidth)+'px', width:(this.pathPoints[4].x-this.pathPoints[0].x-6)+'px', height:(this.pathPoints[5].y-this.pathPoints[0].y-6)+'px'});
                        domStyle.set(this.inputNode, {top:(this.pathPoints[0].y+3+mdy+this.surface.borderWidth)+'px', width:(this.pathPoints[4].x-this.pathPoints[0].x-6)+'px', height:(this.pathPoints[5].y-this.pathPoints[0].y-6)+'px'});
                    }));

                    this._connects.push(this.x.on(touch.release, lang.hitch(this, this.onXTouched)));

                    this._connects.push(connect.connect(this.txtNode, touch.release, this, function (e)
                    {
                        if (this.selected)
                        {
                            this._openKeybord();
                        }
                        else
                        {
                            this.surface.selectShape(this);
                        }
                    }));
                }
            },
            _openKeybord: function(e)
            {
                domStyle.set(this.txtNode, 'display', 'none');
                domStyle.set(this.inputNode, 'display', '');

                var self = this;
                window.setTimeout(function(){
                    self.inputElement.focus();
                }, 300);
                dom.byId("hiddenBtn").focus();
            },
            _closeKeybord: function(e)
            {
                domStyle.set(this.txtNode, 'display', '');
                domStyle.set(this.inputNode, 'display', 'none');

                this.inputElement.blur();
                dom.byId("hiddenBtn").focus();
                dom.byId("hiddenBtn").click();

                if (cordova&&cordova.exec)
                {
                    cordova.exec(
                        function (result)
                        {
                        },
                        function (err)
                        {
                            alert(err);
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

                var leftX = cp[0].x, rightX = cp[4].x;
                var leftY1 = cp[0].y, leftY2 = cp[5].y;

                var x2, x3, x4, mdx = this.path.matrix?this.path.matrix.dx:0;

                x3 = cp[2].x = boundingBox[0].x+(Math.round((boundingBox[1].x-boundingBox[0].x)/2))-mdx;
                if (((cp[1].x + eX) <= leftX)||((cp[2].x + eX) <=leftX))
                {
                    x2 = cp[1].x = leftX + 10;
                    x4 = cp[3].x = x2 + this.earDistance;
                }
                else if (((cp[3].x + eX) >= rightX)||((cp[2].x + eX) >= rightX))
                {
                    x4 = cp[3].x = rightX -10;
                    x2 = cp[1].x = x4 - this.earDistance;
                }
                else
                {
                    x2 = cp[1].x = cp[1].x + eX;
                    x4 = cp[3].x = cp[3].x + eX;
                }

                var y3 = cp[2].y = cp[2].y + eY;

                var path = "M"+leftX+" "+leftY1 + " L"+x2+" "+leftY1+" L"+x3+" "+y3+" L"+x4+" "+leftY1+" L"+rightX+" "+leftY1+
                    " L"+rightX+" "+leftY2+" L"+leftX+" "+leftY2+ " L"+ leftX+" "+leftY1 + " Z";

                this.earHeight += eY;

                return {
                    path: path,
                    endpointsPos:[
                        {x: leftX, y: leftY2},
                        {x: x3, y: y3},
                        {x: rightX, y: leftY1}],
                    xPos:{x: rightX-6, y:leftY1-40}
                };
            },
            _getBoxPointsPathForBTEndpointChange: function(eX, eY)
            {
                var cp = this.pathPoints;

                var leftX = cp[0].x = cp[0].x + eX, rightX = cp[4].x;
                var leftY1 = cp[0].y, leftY2 = cp[5].y = cp[5].y+eY;

                var x2 = cp[1].x;
                var x3 = cp[2].x ;
                var y3 = cp[2].y;
                var x4 = cp[3].x;

                var path = "M"+leftX+" "+leftY1 + " L"+x2+" "+leftY1+" L"+x3+" "+y3+" L"+x4+" "+leftY1+" L"+rightX+" "+leftY1+
                    " L"+rightX+" "+leftY2+" L"+leftX+" "+leftY2+ " L"+ leftX+" "+leftY1 + " Z";

                return {
                    path: path,
                    endpointsPos:[
                        {x: leftX, y: leftY2},
                        {x: x3, y: y3},
                        {x: rightX, y: leftY1}],
                    xPos:{x: rightX-6, y:leftY1-40}
                };
            },
            _getBoxPointsPathForUREndpointChange: function(eX, eY)
            {
                var cp = this.pathPoints;

                var leftX = cp[0].x, rightX = cp[4].x = cp[4].x+eX;
                var leftY1 = cp[0].y = cp[0].y+eY, leftY2 = cp[5].y;

                var x2 = cp[1].x;
                var x3 = cp[2].x;
                var y3 = cp[2].y;
                var x4 = cp[3].x;

                var path = "M"+leftX+" "+leftY1 + " L"+x2+" "+leftY1+" L"+x3+" "+y3+" L"+x4+" "+leftY1+" L"+rightX+" "+leftY1+
                    " L"+rightX+" "+leftY2+" L"+leftX+" "+leftY2+ " L"+ leftX+" "+leftY1 + " Z";

                return {
                    path: path,
                    endpointsPos:[
                        {x: leftX, y: leftY2},
                        {x: x3, y: y3},
                        {x: rightX, y: leftY1}],
                    xPos:{x: rightX-6, y:leftY1-40}
                };
            },
            _getBoxPointsPathByShapeJson: function()
            {
                var cp = this.pathPoints = this.shapeJson.points;

                var leftX = cp[0].x, rightX = cp[4].x;
                var leftY1 = cp[0].y, leftY2 = cp[5].y;

                var x2 = cp[1].x;
                var x3 = cp[2].x;
                var y3 = cp[2].y;
                var x4 = cp[3].x;

                var path = "M"+leftX+" "+leftY1 + " L"+x2+" "+leftY1+" L"+x3+" "+y3+" L"+x4+" "+leftY1+" L"+rightX+" "+leftY1+
                    " L"+rightX+" "+leftY2+" L"+leftX+" "+leftY2+ " L"+ leftX+" "+leftY1 + " Z";

                return {
                    path: path,
                    endpointsPos:[
                        {x: leftX, y: leftY2},
                        {x: x3, y: y3},
                        {x: rightX, y: leftY1}],
                    xPos:{x: rightX-6, y:leftY1-40}
                };
            },
            _isEarMoveable: function(dx, dy)
            {
                var cp = this.pathPoints;

                if ((cp[2].y + dy) >= (cp[0].y - this.circleR))
                {
                    return false;
                }

                return true;
            },
            _isEndpoint1Moveable: function(dx, dy)
            {
                var cp = this.pathPoints;
                var leftX = cp[0].x, leftY1 = cp[0].y, leftY2 = cp[5].y, x2 = cp[1].x;

                if ((leftX + dx + 10) >= x2)
                {
                    return false;
                }

                if ((leftY2 - leftY1 + dy) >= (this.boxHeight*3) || (leftY2 - leftY1 + dy) < this.boxHeight)
                {
                    return false;
                }

                return true;
            },
            _isEndpoint3Moveable: function(dx, dy)
            {
                var cp = this.pathPoints;
                var rightX = cp[4].x, leftY1 = cp[0].y, leftY2 = cp[5].y, x4 = cp[3].x;

                if ((rightX + dx - 10) <= x4)
                {
                    return false;
                }

                if ((leftY2 - leftY1 - dy) >= (this.boxHeight*3) || (leftY2 - leftY1 - dy) < this.boxHeight)
                {
                    return false;
                }

                if ((cp[2].y - dy) >= (cp[0].y - this.circleR))
                {
                    return false;
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
                surface.remove(this.endpoint3);

                domConstruct.destroy(this.txtNode);
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
                    this.endpoint3.setStroke(this.endpointStrokeStyle).setFill(this.endpointFillStyle);
                }
                else
                {
                    this.endpoint1.setStroke(this.endpointHiddenStrokeStyle).setFill(this.endpointHiddenFillStyle);
                    this.endpoint2.setStroke(this.endpointHiddenStrokeStyle).setFill(this.endpointHiddenFillStyle);
                    this.endpoint3.setStroke(this.endpointHiddenStrokeStyle).setFill(this.endpointHiddenFillStyle);
                }
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

                return {type:this.shapeType, points:ps, comment:this.inputElement.value};
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
                var x2 = ps[1].x, x3 = ps[2].x, y1 = ps[0].y, y3 = ps[2].y, x4 = ps[3].x;

                if ((x4 - x2) < this.earDistance)
                {
                    var dx = Math.round((this.earDistance-(x4 - x2))/2);
                    ps[1].x = ps[1].x - dx;
                    ps[3].x = ps[3].x + dx;
                }
                else if ((x4 - x2) > this.earDistance)
                {
                    var dx = Math.round(((x4 - x2)-this.earDistance)/2);
                    ps[1].x = ps[1].x + dx;
                    ps[3].x = ps[3].x - dx;
                }

                if ((y1-y3) <this.earHeight)
                {
                    var dy = this.earHeight - (y1-y3);

                    ps[0].y += dy;
                    ps[1].y += dy;
                    ps[3].y += dy;
                    ps[4].y += dy;
                    ps[5].y += dy;
                    ps[6].y += dy;
                }
                else if ((y1-y3) >this.earHeight)
                {
                    var dy = (y1-y3)-this.earHeight;

                    ps[0].y -= dy;
                    ps[1].y -= dy;
                    ps[3].y -= dy;
                    ps[4].y -= dy;
                    ps[5].y -= dy;
                    ps[6].y -= dy;
                }
                // check the box height and make sure it's should be up to 4 lines height
                var leftY1 = ps[0].y, leftY2 = ps[5].y;

                var boxWidth = ps[4].x-ps[0].x,
                    pxPerChar = 8,
                    charsPerLine = boxWidth/pxPerChar;

                var commentText = this.shapeJson.comment;
                var lines = Math.max(Math.round(commentText.length/charsPerLine),1);

                if (lines > 4 )
                {
                    lines = 4;
                    var shortText = commentText.substr(0, charsPerLine*4-Math.round(charsPerLine/2))+"...";
                    //this.shortText = shortText;
                }

                var boxHeight = this.boxHeight + (lines-1)*20;
                ps[5].y = ps[6].y = leftY1+boxHeight;
            }
        });
    });
