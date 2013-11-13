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
            getShape: function()
            {
                var shape = this.rectangle.getShape();
                var dx = this.rectangle.matrix?this.rectangle.matrix.dx:0;
                var dy = this.rectangle.matrix?this.rectangle.matrix.dy:0;

                return {x:shape.x+dx, y:shape.y+dy, width:shape.width, height:shape.height}
            }
        });
    });
