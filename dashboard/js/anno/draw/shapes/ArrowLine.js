define([
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "dojo/touch",
    "dojox/gfx",
    "dojox/gfx/move",
    "./BaseShape",
    "../../common/Util"
],
    function (declare, connect, lang, touch, gfx, gfxMove, BaseShape, annoUtil)
    {
        /**
         * @author David Lee
         * ArrowLine class
         */
        return declare("anno.draw.shapes.ArrowLine", [BaseShape], {
            arrowLength: 25,
            arrowAngle: Math.PI / 8,
            lineStrokeStyle: {color: annoUtil.level1Color, width: 3},
            arrowHeadFillStyle: "rgba("+annoUtil.level1ColorRGB+", 1)",
            shapeType: "ArrowLine",
            minSize:100,
            arrowPoints:null,
            redrawn:false,
            createShape: function (args)
            {
                this.createArrowLine(args);

                if (this.selectable)
                {
                    this.surface.selectShape(this);
                }
            },
            createArrowLine: function (args)
            {
                var x1 = args.x1, y1 = args.y1, x2 = args.x2, y2 = args.y2;
                var circleR = this.circleR;
                var surface = this.surface.surface;

                var length = this.arrowLength;
                var angle = this.arrowAngle;
                var arrowLinePoints;
                var endPointFillStyle = this.endpointFillStyle,
                    endPointStrokeStyle = this.endpointStrokeStyle,
                    xColor = this.xColor;

                if (args.shapeJson)
                {
                    this.translateValues();

                    x1 = args.shapeJson._o.x1, y1 = args.shapeJson._o.y1, x2 = args.shapeJson._o.x2, y2 = args.shapeJson._o.y2;
                    arrowLinePoints = this.arrowPoints = args.shapeJson.points;

                    endPointFillStyle = this.endpointHiddenStrokeStyle;
                    endPointStrokeStyle = this.endpointHiddenFillStyle;
                    xColor = this.xHiddenColor;
                }
                else
                {
                    arrowLinePoints = this.arrowPoints = this._getShapePoints(x1, y1, x2, y2, angle, length);
                }

                var linePoints = arrowLinePoints.line;
                var arrowPoints = arrowLinePoints.arrow;

                this.line = surface.createLine({x1: linePoints[0].x, y1: linePoints[0].y, x2: linePoints[1].x, y2: linePoints[1].y}).setStroke(this.lineStrokeStyle);
                this.line._o = {x1: x1, y1: y1, x2: x2, y2: y2};
                this.line.isSelectTarget = true;
                this.line.sid = this.id;

                this.arrowHead = surface
                    .createPath("M" + arrowPoints[0].x + " " + arrowPoints[0].y + " L" + arrowPoints[1].x + " " + arrowPoints[1].y + " L" + arrowPoints[2].x + " " + arrowPoints[2].y + " L" + arrowPoints[0].x + " " + arrowPoints[0].y + " Z")
                    .setStroke(this.lineStrokeStyle)
                    .setFill(this.arrowHeadFillStyle);
                this.arrowHead.isSelectTarget = true;
                this.arrowHead.sid = this.id;

                var hiddenAreaPoints = arrowLinePoints.hiddenArea;

                this.hiddenArea = surface.createLine({x1: hiddenAreaPoints[0].x, y1: hiddenAreaPoints[0].y, x2: hiddenAreaPoints[1].x, y2: hiddenAreaPoints[1].y}).setStroke({color: this.hiddenStyle, width: 40});
                this.hiddenArea.isSelectTarget = true;
                this.hiddenArea.sid = this.id;

                this.endpoint1 = surface.createCircle({cx: linePoints[0].x, cy: linePoints[0].y, r: circleR}).setStroke(endPointStrokeStyle).setFill(endPointFillStyle);
                this.endpoint2 = surface.createCircle({cx: arrowPoints[1].x, cy: arrowPoints[1].y, r: circleR}).setStroke(endPointStrokeStyle).setFill(endPointFillStyle);
                this.endpoint1.sid = this.id;
                this.endpoint2.sid = this.id;

                var xPoints = arrowLinePoints.x;
                this.createX(xPoints[0].x, xPoints[0].y, xColor);
                this.x.sid = this.id;
                this.x.isX = true;

                if (this.selectable)
                {
                    var hiddenAreaMover = new gfx.Moveable(this.hiddenArea);

                    var circle1Mover = new gfx.Moveable(this.endpoint1);
                    var circle2Mover = new gfx.Moveable(this.endpoint2);

                    this._connects.push(connect.connect(hiddenAreaMover, "onMoved", this, function (mover, shift)
                    {
                        if (this.isEndpointOutScreen(this.endpoint1, shift.dx, shift.dy)||this.isEndpointOutScreen(this.endpoint2, shift.dx, shift.dy))
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        this.line.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.arrowHead.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.endpoint1.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.endpoint2.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.x.applyTransform({dy: shift.dy, dx: shift.dx});

                        this.redrawn = false;
                    }));

                    this._connects.push(connect.connect(circle1Mover, "onMoved", this, function (mover, shift)
                    {
                        if (!this.isMoveable())
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        if (this.isEndpointOutScreen(this.endpoint1, shift.dx, shift.dy))
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        var o = this.line._o;
                        var arrowLinePoints = this._getShapePoints(o.x1 + shift.dx, o.y1 + shift.dy, o.x2, o.y2, angle, length);

                        if (arrowLinePoints.distance< this.minSize )
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        this.arrowPoints = arrowLinePoints;

                        this._redrawShape(arrowLinePoints);
                        this.line._o = {x1: o.x1 + shift.dx, y1: o.y1 + shift.dy, x2: o.x2, y2: o.y2};
                    }));

                    this._connects.push(connect.connect(circle2Mover, "onMoved", this, function (mover, shift)
                    {
                        if (!this.isMoveable())
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        if (this.isEndpointOutScreen(this.endpoint2, shift.dx, shift.dy))
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        var o = this.line._o;
                        var arrowLinePoints = this._getShapePoints(o.x1, o.y1, o.x2 + shift.dx, o.y2 + shift.dy, angle, length);

                        if (arrowLinePoints.distance< this.minSize )
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        this.arrowPoints = arrowLinePoints;
                        this._redrawShape(arrowLinePoints);
                        this.line._o = {x1: o.x1, y1: o.y1, x2: o.x2 + shift.dx, y2: o.y2 + shift.dy};
                    }));

                    this._connects.push(this.x.on(touch.release, lang.hitch(this, this.onXTouched)));
                }
            },
            _getShapePoints: function (x1, y1, x2, y2, angle, d)
            {
                var arrowPoints = {
                    line: [],
                    arrow: [],
                    hiddenArea: [],
                    x:[],
                    distance:0
                };

                var dist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
                arrowPoints.distance = dist;

                var ratio = (dist - d / 3) / dist;
                var toX, toY, fromX, fromY;

                toX = Math.round(x1 + (x2 - x1) * ratio);
                toY = Math.round(y1 + (y2 - y1) * ratio);
                fromX = x1;
                fromY = y1;

                arrowPoints.line.push({x: fromX, y: fromY});
                arrowPoints.line.push({x: toX, y: toY});

                var newRatio = (dist - 20) / dist;
                var newRatio2 = (dist - 40) / dist;

                var hiddenXE = Math.round(x1 + (x2 - x1) * newRatio2);
                var hiddenYE = Math.round(y1 + (y2 - y1) * newRatio2);
                var hiddenXS = x1 + (x2 - x1) * (1 - newRatio);
                var hiddenYS = y1 + (y2 - y1) * (1 - newRatio);

                arrowPoints.hiddenArea.push({x: hiddenXS, y: hiddenYS});
                arrowPoints.hiddenArea.push({x: hiddenXE, y: hiddenYE});

                var newRatioX = (dist + 50) / dist;
                //var xE = Math.round(x1 + (x2 - x1) * newRatioX);
                //var yE = Math.round(y1 + (y2 - y1) * newRatioX);

                var xE = x2 + 50;
                var yE = y2 - 50;

                arrowPoints.x.push({x: xE, y: yE});

                // calculate the angle of the line
                var lineAngle = Math.atan2(y2 - y1, x2 - x1);
                // h is the line length of a side of the arrow head
                var h = Math.abs(d / Math.cos(angle));

                // handle far end arrow head
                var angle1 = lineAngle + Math.PI + angle;
                var topX = x2 + Math.cos(angle1) * h;
                var topY = y2 + Math.sin(angle1) * h;
                var angle2 = lineAngle + Math.PI - angle;
                var botX = x2 + Math.cos(angle2) * h;
                var botY = y2 + Math.sin(angle2) * h;

                arrowPoints.arrow.push({x: topX, y: topY});
                arrowPoints.arrow.push({x: x2, y: y2});
                arrowPoints.arrow.push({x: botX, y: botY});

                return arrowPoints;
            },
            _redrawShape:function(arrowPoints)
            {
                var linePoints = arrowPoints.line;
                var arrowHeadPoints = arrowPoints.arrow;
                var hiddenAreaPoints = arrowPoints.hiddenArea;
                var xPoints = arrowPoints.x;

                this.line.setShape({x1: linePoints[0].x, y1: linePoints[0].y, x2: linePoints[1].x, y2: linePoints[1].y});
                this.arrowHead.setShape("M" + arrowHeadPoints[0].x + " " + arrowHeadPoints[0].y + " L" + arrowHeadPoints[1].x + " " + arrowHeadPoints[1].y + " L" + arrowHeadPoints[2].x + " " + arrowHeadPoints[2].y + " L" + arrowHeadPoints[0].x + " " + arrowHeadPoints[0].y + " Z");
                this.hiddenArea.setShape({x1: hiddenAreaPoints[0].x, y1: hiddenAreaPoints[0].y, x2: hiddenAreaPoints[1].x, y2: hiddenAreaPoints[1].y});
                this.x.setShape({x: xPoints[0].x, y: xPoints[0].y});

                this.redrawn = true;
            },
            destroy: function ()
            {
                this.inherited(arguments);

                var surface = this.surface.surface;

                surface.remove(this.line);
                surface.remove(this.arrowHead);
                surface.remove(this.hiddenArea);
                surface.remove(this.endpoint1);
                surface.remove(this.endpoint2);
            },
            setSelected: function(sel)
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
                }
            },
            moveToFront: function()
            {
                this.line.moveToFront();
                this.arrowHead.moveToFront();
                this.hiddenArea.moveToFront();

                this.endpoint1.moveToFront();
                this.endpoint2.moveToFront();

                this.inherited(arguments);
            },
            setId: function(id)
            {
                this.inherited(arguments);
            },
            toJSON: function()
            {
                var ps = lang.clone(this.arrowPoints), _o = lang.clone(this.line._o);
                var jsonObject = {type:this.shapeType, points:ps, "_o":_o};

                if (this.line.matrix)
                {
                    // apply transform dx, dy.
                    var dx = this.line.matrix.dx || 0;
                    var dy = this.line.matrix.dy || 0;

                    ps.line[0].x += dx;
                    ps.line[0].y += dy;
                    ps.line[1].x += dx;
                    ps.line[1].y += dy;

                    ps.arrow[0].x += dx;
                    ps.arrow[0].y += dy;
                    ps.arrow[1].x += dx;
                    ps.arrow[1].y += dy;
                    ps.arrow[2].x += dx;
                    ps.arrow[2].y += dy;

                    ps.hiddenArea[0].x += dx;
                    ps.hiddenArea[0].y += dy;
                    ps.hiddenArea[1].x += dx;
                    ps.hiddenArea[1].y += dy;

                    ps.x[0].x += dx;
                    ps.x[0].y += dy;
                }

                // convert all values into relative values
                ps.line[0].x = this.toRelativeValue(ps.line[0].x, true);
                ps.line[0].y = this.toRelativeValue(ps.line[0].y, false);
                ps.line[1].x = this.toRelativeValue(ps.line[1].x, true);
                ps.line[1].y = this.toRelativeValue(ps.line[1].y, false);

                ps.arrow[0].x = this.toRelativeValue(ps.arrow[0].x, true);
                ps.arrow[0].y = this.toRelativeValue(ps.arrow[0].y, false);
                ps.arrow[1].x = this.toRelativeValue(ps.arrow[1].x, true);
                ps.arrow[1].y = this.toRelativeValue(ps.arrow[1].y, false);
                ps.arrow[2].x = this.toRelativeValue(ps.arrow[2].x, true);
                ps.arrow[2].y = this.toRelativeValue(ps.arrow[2].y, false);

                ps.hiddenArea[0].x = this.toRelativeValue(ps.hiddenArea[0].x, true);
                ps.hiddenArea[0].y = this.toRelativeValue(ps.hiddenArea[0].y, false);
                ps.hiddenArea[1].x = this.toRelativeValue(ps.hiddenArea[1].x, true);
                ps.hiddenArea[1].y = this.toRelativeValue(ps.hiddenArea[1].y, false);

                ps.x[0].x = this.toRelativeValue(ps.x[0].x, true);
                ps.x[0].y = this.toRelativeValue(ps.x[0].y, false);

                _o.x1 = this.toRelativeValue(_o.x1, true);
                _o.y1 = this.toRelativeValue(_o.y1, false);
                _o.x2 = this.toRelativeValue(_o.x2, true);
                _o.y2 = this.toRelativeValue(_o.y2, false);

                return jsonObject;
            },
            translateValues:function()
            {
                var ps = this.shapeJson.points, _o = this.shapeJson._o;

                // convert all relative values into real values
                ps.line[0].x = this.translateValue(ps.line[0].x, true);
                ps.line[0].y = this.translateValue(ps.line[0].y, false);
                ps.line[1].x = this.translateValue(ps.line[1].x, true);
                ps.line[1].y = this.translateValue(ps.line[1].y, false);

                ps.arrow[0].x = this.translateValue(ps.arrow[0].x, true);
                ps.arrow[0].y = this.translateValue(ps.arrow[0].y, false);
                ps.arrow[1].x = this.translateValue(ps.arrow[1].x, true);
                ps.arrow[1].y = this.translateValue(ps.arrow[1].y, false);
                ps.arrow[2].x = this.translateValue(ps.arrow[2].x, true);
                ps.arrow[2].y = this.translateValue(ps.arrow[2].y, false);

                ps.hiddenArea[0].x = this.translateValue(ps.hiddenArea[0].x, true);
                ps.hiddenArea[0].y = this.translateValue(ps.hiddenArea[0].y, false);
                ps.hiddenArea[1].x = this.translateValue(ps.hiddenArea[1].x, true);
                ps.hiddenArea[1].y = this.translateValue(ps.hiddenArea[1].y, false);

                ps.x[0].x = this.translateValue(ps.x[0].x, true);
                ps.x[0].y = this.translateValue(ps.x[0].y, false);

                _o.x1 = this.translateValue(_o.x1, true);
                _o.y1 = this.translateValue(_o.y1, false);
                _o.x2 = this.translateValue(_o.x2, true);
                _o.y2 = this.translateValue(_o.y2, false);
            }
        });
    });
