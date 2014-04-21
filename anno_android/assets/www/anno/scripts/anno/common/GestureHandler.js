define([], function ()
{
    var _touchStartHandler = function (e)
    {
        gestureHandler._touchStart(e);
    };

    var _touchMoveHandler = function (e)
    {
        gestureHandler._touchMove(e);
    };

    var _touchEndHandler = function (e)
    {
        gestureHandler._touchEnd(e);
    };

    var _touchCancelHandler = function (e)
    {
        gestureHandler._touchCancel(e);
    };

    var gestureHandler = {
        start: false,
        touchPoints:{
            start:{}
        },
        minRadius: 50,
        _clearPoints: function()
        {
            this.touchPoints = {
                start:{}
            };
        },
        _touchStart: function(e)
        {
            this._clearPoints();
            if (e.touches.length == 1)
            {
                this.touchPoints.start.x = e.touches[0].pageX;
                this.touchPoints.start.y = e.touches[0].pageY;

                console.log("touch start at ("+this.touchPoints.start.x+","+this.touchPoints.start.y+")");
                console.log("Detecting spiral gesture......");
            }
        },
        _touchMove: function(e)
        {
            if (e.touches.length == 1)
            {
                e.preventDefault();
                var x = e.touches[0].pageX, y = e.touches[0].pageY, startX = this.touchPoints.start.x, startY = this.touchPoints.start.y;

                if (!this.touchPoints.p1)
                {
                    this.handleP1(e);
                }
                else
                {
                    if (x > this.touchPoints.p1.x && y > this.touchPoints.p1.y)
                    {
                        this.handleP1(e);
                    }
                    else
                    {
                        if (!this.touchPoints.p2)
                        {
                            this.handleP2(e);
                        }
                        else
                        {
                            if (!this.touchPoints.p3)
                            {
                                this.handleP3(e);
                            }
                            else
                            {
                                if (!this.touchPoints.p4)
                                {
                                    this.handleP4(e);
                                }
                            }
                        }
                    }
                }

                console.log("touch move at ("+x+","+y+")");
            }
        },
        _touchEnd: function(e)
        {
            if (this.touchPoints.start
                && this.touchPoints.p1
                && this.touchPoints.p2
                && this.touchPoints.p3
                && this.touchPoints.p4
                )
            {
                console.log("spiral gesture detected!");
                this._clearPoints();
                if (window.cordova&&cordova.exec)
                {
                    cordova.exec(
                        function (data)
                        {

                        },
                        function (err)
                        {
                            alert(err);
                        },
                        "AnnoCordovaPlugin",
                        'trigger_create_anno',
                        []
                    );
                }
            }
            else
            {
                console.log("spiral gesture not detected!");
                this._clearPoints();
            }
        },
        _touchCancel: function(e)
        {
            this._clearPoints();
            console.log("_touchCancel");
        },
        handleP1: function(e)
        {
            var x = e.touches[0].pageX, y = e.touches[0].pageY, startX = this.touchPoints.start.x, startY = this.touchPoints.start.y;

            if (!this.touchPoints.p1)
            {
                if ((x >= (startX+this.minRadius)) && (y >= (startY+this.minRadius)))
                {
                    this.touchPoints.p1 = {x: x, y:y};
                    console.log("got P1 at ("+x+","+y+")");
                }
            }
            else
            {
                this.touchPoints.p1.x = x;
                this.touchPoints.p1.y = y;
                console.log("got P1 at ("+x+","+y+")");
            }
        },
        handleP2: function(e)
        {
            var x = e.touches[0].pageX, y = e.touches[0].pageY, p1x = this.touchPoints.p1.x, p1y = this.touchPoints.p1.y;
            var startX = this.touchPoints.start.x, startY = this.touchPoints.start.y;
            var r = p1y - startY, delta = r*0.5;

            if (!this.touchPoints.p2)
            {
                if (Math.abs(x - startX) <=delta && (((y - p1y) >=r*0.5)&&((y - p1y) <=r*1.5)))
                {
                    this.touchPoints.p2 = {x: x, y:y};
                    console.log("got P2 at ("+x+","+y+")");
                }
            }
        },
        handleP3: function(e)
        {
            var x = e.touches[0].pageX, y = e.touches[0].pageY, p2x = this.touchPoints.p2.x;
            var p1y = this.touchPoints.p1.y, p2y = this.touchPoints.p2.y, startY = this.touchPoints.start.y;
            var r = p1y - startY, delta = r*0.5;

            if (!this.touchPoints.p3)
            {
                if (((p2x - x) >=delta&&(p2x - x) <=(r*1.5)) && ((p2y - y) >=delta&&(p2y - y) <=(r*1.5)))
                {
                    this.touchPoints.p3 = {x: x, y:y};
                    console.log("got P3 at ("+x+","+y+")");
                }
            }
        },
        handleP4: function(e)
        {
            var x = e.touches[0].pageX, y = e.touches[0].pageY, p3x = this.touchPoints.p3.x;
            var p3y = this.touchPoints.p3.y, p1x = this.touchPoints.p1.x, startY = this.touchPoints.start.y;

            if (!this.touchPoints.p4)
            {
                if (((x > (p3x+2)) && (x < p1x)) && ((y< p3y)&&(y>=startY)) )
                {
                    this.touchPoints.p4 = {x: x, y:y};
                    console.log("got P4 at ("+x+","+y+")");
                }
            }
        },
        enableJSGesture: function()
        {
            this._attachTouchEvents();
        },
        disableJSGesture: function()
        {
            this._detachTouchEvents();
        },
        _attachTouchEvents: function()
        {
            this._detachTouchEvents();

            document.body.addEventListener("touchstart", _touchStartHandler, false);
            document.body.addEventListener("touchmove", _touchMoveHandler, false);
            document.body.addEventListener("touchend", _touchEndHandler, false);
            document.body.addEventListener("touchcancel", _touchCancelHandler, false);
        },
        _detachTouchEvents: function()
        {
            document.body.removeEventListener("touchstart", _touchStartHandler, false);
            document.body.removeEventListener("touchmove", _touchMoveHandler, false);
            document.body.removeEventListener("touchend", _touchEndHandler, false);
            document.body.removeEventListener("touchcancel", _touchCancelHandler, false);
        }
    };

    return gestureHandler;
});
