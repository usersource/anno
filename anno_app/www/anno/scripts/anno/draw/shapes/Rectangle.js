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
         * Rectangle class
         */
        return declare("anno.draw.shapes.Rectangle", [BaseShape], {
            lineStrokeStyle: {color: annoUtil.level1Color, width: annoUtil.annotationWidth},
            shapeType: "Rectangle",
            minSize:50,
            createShape: function (args)
            {
                this.createRectangle(args);
                this.checkLevelColor(this.level);

                if (this.selectable)
                {
                    this.surface.selectShape(this);
                }
            },
            createRectangle: function (args)
            {
                var startX = args.startX, startY = args.startY, width = args.width, height = args.height;
                var circleR = this.circleR;
                var surface = this.surface.surface;

                var endPointFillStyle = this.endpointFillStyle,
                    endPointStrokeStyle = this.endpointStrokeStyle,
                    xColor = this.xColor;

                if (args.shapeJson)
                {
                    this.translateValues();

                    startX = args.shapeJson.points.x;
                    startY = args.shapeJson.points.y;
                    width = args.shapeJson.points.width;
                    height = args.shapeJson.points.height;

                    endPointFillStyle = this.endpointHiddenStrokeStyle;
                    endPointStrokeStyle = this.endpointHiddenFillStyle;
                    xColor = this.xHiddenColor;
                }

                this.rectangle = surface.createRect({x: startX, y: startY, width: width, height: height, r: 0}).setStroke(this.lineStrokeStyle).setFill(this.hiddenColor);
                this.rectangle.isSelectTarget = true;
                this.rectangle.sid = this.id;

                // David asked only 2 endpoint
                this.endpoint2 = surface.createCircle({cx: startX + width, cy: startY, r: circleR}).setStroke(endPointStrokeStyle).setFill(endPointFillStyle);
                this.endpoint4 = surface.createCircle({cx: startX, cy: startY + height, r: circleR}).setStroke(endPointStrokeStyle).setFill(endPointFillStyle);

                this.endpoint2.sid = this.id;
                this.endpoint4.sid = this.id;

                this.createX(startX + width + 50, startY - 30, this.hiddenColor);

                if (this.selectable)
                {
                    var rectangleMover = new gfx.Moveable(this.rectangle);
                    var endpoint2Mover = new gfx.Moveable(this.endpoint2);
                    var endpoint4Mover = new gfx.Moveable(this.endpoint4);

                    this._connects.push(connect.connect(rectangleMover, "onMoved", this, function (mover, shift)
                    {
                        if (this.isEndpointOutScreen(this.endpoint2, shift.dx, shift.dy)||this.isEndpointOutScreen(this.endpoint4, shift.dx, shift.dy))
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        this.endpoint2.applyTransform({dy: shift.dy, dx: shift.dx});
                        this.endpoint4.applyTransform({dy: shift.dy, dx: shift.dx});

                        this.x.applyTransform({dy: shift.dy, dx: shift.dx});
                    }));

                    this._connects.push(connect.connect(endpoint2Mover, "onMoved", this, function (mover, shift)
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

                        var o = this.rectangle.getShape();

                        if ((o.width + shift.dx)< this.minSize && shift.dx<0)
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        if ((o.height - shift.dy)< this.minSize && shift.dy>0)
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        this.rectangle.setShape({x: o.x, y: o.y + shift.dy, width: o.width + shift.dx, height: o.height - shift.dy});

                        this.x.applyTransform({dy: shift.dy, dx: shift.dx});
                    }));

                    this._connects.push(connect.connect(endpoint4Mover, "onMoved", this, function (mover, shift)
                    {
                        if (!this.isMoveable())
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        if (this.isEndpointOutScreen(this.endpoint4, shift.dx, shift.dy))
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        var o = this.rectangle.getShape();

                        if ((o.width - shift.dx)< this.minSize && shift.dx>0)
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        if ((o.height + shift.dy)< this.minSize && shift.dy<0)
                        {
                            this.rollbackEndpoint(mover.shape, shift);
                            return;
                        }

                        this.rectangle.setShape({x: o.x + shift.dx, y: o.y, width: o.width - shift.dx, height: o.height + shift.dy});
                    }));

                    this._connects.push(this.x.on(touch.release, lang.hitch(this, this.onXTouched)));
                }
            },
            destroy: function ()
            {
                this.inherited(arguments);

                var surface = this.surface.surface;

                surface.remove(this.rectangle);
                surface.remove(this.endpoint2);
                surface.remove(this.endpoint4);
            },
            setSelected: function (sel)
            {
                this.inherited(arguments);
                if (!this.selectable) return;

                if (sel)
                {
                    this.endpoint2.setStroke(this.endpointStrokeStyle).setFill(this.endpointFillStyle);
                    this.endpoint4.setStroke(this.endpointStrokeStyle).setFill(this.endpointFillStyle);
                }
                else
                {
                    this.endpoint2.setStroke(this.endpointHiddenStrokeStyle).setFill(this.endpointHiddenFillStyle);
                    this.endpoint4.setStroke(this.endpointHiddenStrokeStyle).setFill(this.endpointHiddenFillStyle);
                }
            },
            moveToFront: function()
            {
                this.rectangle.moveToFront();
                this.endpoint2.moveToFront();
                this.endpoint4.moveToFront();

                this.inherited(arguments);
            },
            setId: function (id)
            {
                this.inherited(arguments);
            },
            toJSON: function()
            {
                var shape = this.rectangle.getShape();

                var shapeObject = {type:this.shapeType, points:{x: shape.x, y:shape.y, width:shape.width, height:shape.height}};

                if (this.rectangle.matrix)
                {
                    shapeObject.points.x += this.rectangle.matrix.dx||0;
                    shapeObject.points.y += this.rectangle.matrix.dy||0;
                }

                // convert all values into relative values
                shapeObject.points.x = this.toRelativeValue(shapeObject.points.x, true);
                shapeObject.points.y = this.toRelativeValue(shapeObject.points.y, false);
                shapeObject.points.width = this.toRelativeValue(shapeObject.points.width, true);
                shapeObject.points.height = this.toRelativeValue(shapeObject.points.height, false);

                return shapeObject;
            },
            translateValues:function()
            {
                var ps = this.shapeJson.points;

                // convert all relative values into real values
                ps.x = this.translateValue(ps.x, true);
                ps.y = this.translateValue(ps.y, false);
                ps.width = this.translateValue(ps.width, true);
                ps.height = this.translateValue(ps.height, false);
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
