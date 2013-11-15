define([
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "dojo/touch",
    "dojox/gfx",
    "dojox/gfx/move",
    "./Rectangle"
],
    function (declare, connect, lang, touch, gfx, gfxMove, Rectangle)
    {
        /**
         * @author David Lee
         * AnonymizedRectangle class
         */
        return declare("anno.draw.shapes.AnonymizedRectangle", [Rectangle], {
            lineStrokeStyle: {color: '#000000', width: 0},
            hiddenColor: "rgba(0, 0, 0, 1)",
            shapeType: "AnonymizedRectangle",
            minSize:32,
            getShape: function()
            {
                var shape = this.rectangle.getShape();
                var dx = this.rectangle.matrix?this.rectangle.matrix.dx:0;
                var dy = this.rectangle.matrix?this.rectangle.matrix.dy:0;

                return {x:shape.x+dx, y:shape.y+dy, width:shape.width, height:shape.height}
            },
            isEndpointOutScreen: function(endpoint, dx, dy)
            {
                // check if shape's endpoint was dragged out of screen.
                var boundingBox = endpoint.getTransformedBoundingBox();
                var es = endpoint.getShape(), exl = boundingBox[0].x+dx, exr = boundingBox[1].x+dx, eyt = boundingBox[0].y+dy, eyb = boundingBox[2].y+dy;
                var vp = this.viewPoint;
                if (exl <= -16 || exr>= (vp.w+16))
                {
                    return true;
                }

                if (eyt <= -16 || eyb>= (vp.h+16))
                {
                    return true;
                }

                return false;
            }
        });
    });
