define([
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/window",
    "../../common/Util"
],
    function (
        declare,
        connect,
        lang,
        domConstruct,
        win,
        annoUtil
        )
    {
        /**
         * @author David Lee
         * base class of all shapes
         */
        return declare("anno.draw.shapes.BaseShape", null, {
            circleR: 16, // endpoint circle r
            hiddenStyle:"rgba(255, 255, 255, 0)",
            endpointStrokeStyle:"rgba("+annoUtil.level1ColorRGB+", 1)",
            endpointFillStyle:"rgba("+annoUtil.level1ColorRGB+", 0.5)",
            endpointHiddenStrokeStyle:"rgba("+annoUtil.level1ColorRGB+", 0)",
            endpointHiddenFillStyle:"rgba("+annoUtil.level1ColorRGB+", 0)",
            xFont:{family: "Helvetica", style: "normal", size: "24pt"},
            xColor:"rgba("+annoUtil.level1ColorRGB+", 1)",
            xHiddenColor:"rgba(253, 155, 0, 0)",
            hiddenColor:"rgba(253, 155, 0, 0)",
            selected:false,
            deletable:true,
            selectable:true,
            constructor: function(args)
            {
                lang.mixin(this, args);
                this._connects = [];

                this.viewPoint = {w:this.surface.width, h:this.surface.height};
            },
            createShape: function(args)
            {
            },
            destroy: function()
            {
                var gfxSurface = this.surface.surface;
                gfxSurface.remove(this.x);

                var connectResult = this._connects.pop();
                while (connectResult != null)
                {
                    connect.disconnect(connectResult);
                    connectResult = this._connects.pop();
                }
            },
            setSelected: function(sel)
            {
                if (!this.selectable) return;

                this.selected = sel;

                if (sel&&this.deletable)
                {
                    this.x.setStroke(this.xColor).setFill(this.xColor);
                    this.x.moveToFront();
                }
                else
                {
                    this.x.setStroke(this.xHiddenColor).setFill(this.xHiddenColor);
                }

                if (sel)
                {
                    this.moveToFront();
                }
            },
            moveToFront: function()
            {
                this.x.moveToFront();
            },
            isMoveable: function()
            {
                return this.selectable&&this.selected;
            },
            rollbackEndpoint: function(endpoint, shift)
            {
                var o = endpoint.getShape();

                if (endpoint.declaredClass.indexOf("Rect") > 0)
                {
                    endpoint.setShape({x: o.x-shift.dx, y: o.y-shift.dy});
                }
                else if (endpoint.declaredClass.indexOf("Path") > 0)
                {
                    endpoint.applyTransform({dy: -shift.dy, dx: -shift.dx});
                }
                else if (endpoint.declaredClass.indexOf("Line") > 0)
                {
                    endpoint.applyTransform({dy: -shift.dy, dx: -shift.dx});
                }
                else
                {
                    endpoint.setShape({cx: o.cx-shift.dx, cy: o.cy-shift.dy});
                }
            },
            setId: function(id)
            {
                this.id = id;
            },
            onXTouched: function(e)
            {
                // fired when delete x clicked or touched.
                if (!this.deletable) return;
                if (!this.selected) return;

                this.surface.removeShape(this);
            },
            createX: function(x, y, xColor)
            {
                this.x = this.surface.surface.createText({x: x, y: y, text: "x", align: "middle"}).setFont(this.xFont).setStroke(xColor).setFill(xColor);
            },
            isEndpointOutScreen: function(endpoint, dx, dy)
            {
                // check if shape's endpoint was dragged out of screen.
                var boundingBox = endpoint.getTransformedBoundingBox();
                var es = endpoint.getShape(), exl = boundingBox[0].x+dx, exr = boundingBox[1].x+dx, eyt = boundingBox[0].y+dy, eyb = boundingBox[2].y+dy;
                var vp = this.viewPoint;
                if (exl <= 1 || exr>= vp.w)
                {
                    return true;
                }

                if (eyt <= 1 || eyb>= vp.h)
                {
                    return true;
                }

                return false;
            },
            toJSON: function()
            {
                return this.id;
            },
            toRelativeValue: function(v, xory)
            {
                if (xory)
                    return Math.round((v*10000)/this.viewPoint.w);
                else
                    return Math.round((v*10000)/this.viewPoint.h);
            },
            translateValue: function(v, xory)
            {
                if (xory)
                    return Math.round((this.surface.width*v)/10000);
                else
                    return Math.round((this.surface.height*v)/10000);
            }
        });
    });
