define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin"
],
    function (
        declare,
        lang,
        domConstruct,
        _Widget,
        _TemplatedMixin
        )
    {
        /**
         * @author David Lee
         * Smooth Progress Bar
         */
        return declare("anno.common.SmoothProgressBar", [_Widget, _TemplatedMixin], {
            templateString: "<div><canvas width='200' height='4' data-dojo-attach-point='canvas' style='display: block'></canvas></div>",
            width:200,
            height:4,
            lineColor:"#4CB2D0",
            separatorWidth: 4,
            wFactor: 4,
            strokeLineWidth: 3,
            minLineWidth: 1,
            maxLineWidth: 6,
            maxProgressValue:200,
            showingIndeterminateProgress: false,
            yPos:1,
            _setWidthAttr: function(w)
            {
                this.width = w;

                this.domNode.style.width = w+'px';
                this.canvas.width = w;
            },
            _setHeightAttr: function(h)
            {
                this.height = h;

                this.domNode.style.height = h+'px';
                this.canvas.height = h;
            },
            _clearCanvas: function()
            {
                var ctx = this.canvas.getContext('2d');
                ctx.clearRect(0, 0, this.width, this.height);
            },
            _drawIndeterminateProgressLines: function(firstLineWidth)
            {
                var ctx = this.canvas.getContext('2d');

                ctx.strokeStyle = this.lineColor;
                ctx.lineWidth = this.strokeLineWidth;

                this._clearCanvas();

                var endX = 0;
                var lineWidth = firstLineWidth;
                ctx.beginPath();
                while(endX <= this.width)
                {
                    lineWidth = lineWidth*this.wFactor;
                    ctx.moveTo(endX, this.yPos);
                    ctx.lineTo(endX+lineWidth, this.yPos);

                    endX = endX + lineWidth+this.separatorWidth;
                }

                ctx.stroke();
            },
            showIndeterminateProgress: function()
            {
                this.showingIndeterminateProgress = true;

                var currentLineWidth = this.minLineWidth;
                var self = this;

                this.timerHandle = window.setInterval(function(){
                    self._drawIndeterminateProgressLines(currentLineWidth);
                    currentLineWidth+=0.5;

                    if (currentLineWidth >self.maxLineWidth)
                    {
                        currentLineWidth = self.minLineWidth;
                    }
                }, 60);
            },
            stopIndeterminateProgress: function()
            {
                if (this.timerHandle)
                {
                    window.clearInterval(this.timerHandle);
                    this.timerHandle = null;
                }

                this._clearCanvas();
                this.showingIndeterminateProgress = false;
            },
            showSmoothProgress: function(value)
            {
                var ctx = this.canvas.getContext('2d');
                this.stopIndeterminateProgress();

                if (value <0)
                {
                    this._clearCanvas();
                    return;
                }

                ctx.strokeStyle = this.lineColor;
                ctx.lineWidth = this.strokeLineWidth;

                this._clearCanvas();

                var lineWidth = (value/this.maxProgressValue)*this.width;
                var startX = (this.width-lineWidth)/2;

                ctx.beginPath();
                ctx.moveTo(startX, this.yPos);
                ctx.lineTo(startX + lineWidth, this.yPos);

                ctx.stroke();

                if (value >= this.maxProgressValue)
                {
                    this.onSmoothProgressComplete();
                }
            },
            onSmoothProgressComplete: function()
            {
            }
        });
    });
