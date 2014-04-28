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
        movePoints:[],
        lastMovePoint:[],
        minMoves: 25,
        _clearPoints: function()
        {
            this.movePoints.length = 0;
        },
        _touchStart: function(e)
        {
            if (e.touches.length == 1)
            {
                this._clearPoints();

                console.log("Detecting spiral gesture......");
                this.lastMovePoint[0] = e.touches[0].pageX;
                this.lastMovePoint[1] = e.touches[0].pageX;
                this.movePoints.push([this.lastMovePoint[0], this.lastMovePoint[1]]);
            }
        },
        _touchMove: function(e)
        {
            if (e.touches.length == 1)
            {
                e.preventDefault();
                var x = e.touches[0].pageX, y = e.touches[0].pageY;
                // only record moves that distance > 1
                if (Math.abs(x-this.lastMovePoint[0])>1 &&Math.abs(y-this.lastMovePoint[1])>1)
                {
                    this.movePoints.push([x, y]);
                    this.lastMovePoint[0] = x;
                    this.lastMovePoint[1] = y;
                }
            }
            else
            {
                this._clearPoints();
            }
        },
        _touchEnd: function(e)
        {
            this._recognize();
            this._clearPoints();
        },
        _recognize: function()
        {
            /*
             -----p1----
             |         |
             p4   p5   p2
             |         |
             ----p3----
             */
            var points = this.movePoints, x, y;
            if (points.length < this.minMoves)
            {
                return;
            }

            var p1 = [points[0][0], points[0][1]], p2 = [points[0][0], points[0][1]],
                p3 = [points[0][0], points[0][1]], p4 = [points[0][0], points[0][1]],
                p5 = [];

            for (var i= 1,c=points.length;i<c;i++)
            {
                x = points[i][0];
                y = points[i][1];

                if (y < p1[1])
                {
                    p1[0] = x;
                    p1[1] = y;
                }

                if (x > p2[0])
                {
                    p2[0] = x;
                    p2[1] = y;
                }

                if (y > p3[1])
                {
                    p3[0] = x;
                    p3[1] = y;
                }

                if (x < p4[0])
                {
                    p4[0] = x;
                    p4[1] = y;
                }
            }

            var startX = points[0][0], startY = points[0][1];
            var endX = points[points.length-1][0], endY = points[points.length-1][1];

            if (startY > (p1[1]+20) && startY < (p3[1]-20)&&startX > (p4[0]+20) && startX < (p2[0]-20))
            {
                p5[0] = startX;
                p5[1] = startY;
            }
            else
            {
                p5[0] = endX;
                p5[1] = endY;
            }

            var distanceP5P1 = this.getDistance(p5, p1),
                distanceP5P2 = this.getDistance(p5, p2),
                distanceP5P3 = this.getDistance(p5, p3),
                distanceP5P4 = this.getDistance(p5, p4);

            if (distanceP5P1 ==0 || distanceP5P2 ==0 || distanceP5P3 ==0 || distanceP5P4 ==0)
            {
                console.log("spiral gesture not detected!");
            }
            else
            {
                var averageDistance = (distanceP5P1+distanceP5P2+distanceP5P3+distanceP5P4)/4;
                var delta = averageDistance;//Math.max(distanceP5P1, distanceP5P2, distanceP5P3,distanceP5P4)/1.5;

                if (Math.abs(distanceP5P1 - averageDistance) < delta &&
                    Math.abs(distanceP5P2 - averageDistance) < delta &&
                    Math.abs(distanceP5P3 - averageDistance) < delta &&
                    Math.abs(distanceP5P4 - averageDistance) < delta)
                {
                    console.log("spiral gesture detected!");

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
                }
            }
        },
        getDistance: function(p1, p2)
        {
            var xs = p2[0] - p1[0];
            var ys = p2[1] - p1[1];

            xs = xs * xs;
            ys = ys * ys;

            return Math.sqrt( xs + ys );
        },
        _touchCancel: function(e)
        {
            this._clearPoints();
            console.log("_touchCancel");
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
