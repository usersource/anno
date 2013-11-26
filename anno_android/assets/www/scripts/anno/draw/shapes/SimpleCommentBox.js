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
        return declare("anno.draw.shapes.SimpleCommentBox", [BaseShape], {
            lineStrokeStyle: {color: '#000000', width: 3},
            shapeType: "SimpleCommentBox",
            minSize:50,
            shapePadding: 30,
            earHeight:34,
            earDistance: 44,
            boxHeight:34,
            shareBtnWidth: 64,
            placeholder:"Enter suggestion here",
            grayColor: "#A9A9A9",
            normalColor: "#000000",
            earLow:false,
            isMoved:false,
            oneLineHeight:20,
            lastHeight:20,
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
                var startX = args.startX, startY = args.startY, width = args.width, height = args.height;
                var circleR = this.circleR;
                var surface = this.surface.surface;

                var pathPoints = this._getBoxPointsPath();
                this.path = surface.createPath(pathPoints.path).setStroke(this.lineStrokeStyle).setFill("#ffffff");
                this.path.isSelectTarget = true;
                this.path.sid = this.id;

                this.endpoint2 = surface.createCircle({cx: pathPoints.endpointsPos[1].x, cy: pathPoints.endpointsPos[1].y, r: circleR}).setStroke(this.endpointStrokeStyle).setFill(this.endpointFillStyle);
                this.endpoint2.sid = this.id;

                this.x = surface.createText({x: pathPoints.xPos.x, y: pathPoints.xPos.y, text: "x", align: "middle"}).setFont(this.xFont).setStroke(this.xHiddenColor).setFill(this.xHiddenColor);
                this.x.sid = this.id;
                this.x.isX = true;

                var textNodeTop;

                if (this.earLow)
                {
                    textNodeTop = (this.pathPoints[5].y+3+this.surface.borderWidth);
                }
                else
                {
                    textNodeTop = (this.pathPoints[0].y+3+this.surface.borderWidth);
                }

                // create text node
                var textColor = this.grayColor;

                if (this.commentText&&this.commentText.length)
                {
                    textColor = this.normalColor;
                }

                this.txtNode = domConstruct.create('div', {
                    style: "background-color:transparent;display2:none;padding2:4px;padding-left2:6px;position:absolute;top:"+(textNodeTop)+"px;left:"+(this.pathPoints[0].x+3+this.surface.borderWidth)+"px;width:"+(this.pathPoints[4].x-this.pathPoints[0].x-6)+"px;height:"+(this.pathPoints[5].y-this.pathPoints[0].y-6)+"px",
                    innerHTML:"<div id='textDiv_"+this.id+"' style='padding:3px;overflow:hidden;width:100%;height:100%;font-size: 16px;font-weight: bold;color: "+textColor+";'>"+this.placeholder+"</div>"
                }, document.body, 'last');

                this.txtNode.gfxTarget = {isSelectTarget:true, sid:this.id};
                this.txtNode.children[0].gfxTarget = {isSelectTarget:true, sid:this.id};

                this.inputNode = domConstruct.create('div', {
                    style: "background-color:transparent;display:none;position:absolute;top:"+(textNodeTop)+"px;left:"+(this.pathPoints[0].x+3+this.surface.borderWidth)+"px;width:"+(this.pathPoints[4].x-this.pathPoints[0].x-6)+"px;height:"+(this.pathPoints[5].y-this.pathPoints[0].y-6)+"px",
                    innerHTML:"<textarea id='input_"+this.id+"' placeholder='Enter suggestion here' style='font-family: helvetica, arial;font-size: 16px;font-weight: bold;background-color:transparent;width:100%;overflow-y2: hidden; border-color:transparent;outline: none;overflow-x: auto; box-sizing2: border-box; height: 24px;'></textarea>"
                }, document.body, 'last');
                this.inputElement = dom.byId("input_"+this.id);

                if (this.selectable)
                {
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

                    this._connects.push(connect.connect(this.inputElement, "input", this, function (e)
                    {
                        if (this.inputElement.value)
                        {
                            domStyle.set(this.shareBtnNode, 'display', '');
                            domStyle.set(dom.byId('btnHome'), 'display', 'none');
                            domStyle.set(dom.byId('btnDraw'), 'display', 'none');
                            domStyle.set(dom.byId('topBar'), 'display', 'none');

                            // handle simple-comment box grows in height up to 4 visible lines
                            this.handleBoxHeight();
                        }
                        else
                        {
                            domStyle.set(this.shareBtnNode, 'display', 'none');
                        }

                    }));

                    this._connects.push(connect.connect(this.inputElement, "keydown", this, function (e)
                    {
                        if (e.keyCode == 13)
                        {
                            dojo.stopEvent(e);
                            this._closeKeybord();
                        }
                    }));

                    this._connects.push(connect.connect(this.inputElement, "focus", this, function (e)
                    {
                        if (this.onCommentBoxFocus)
                        {
                            this.onCommentBoxFocus(this);
                        }
                    }));

                    this.shareBtnNode = domConstruct.create('button', {
                        style: "display:none;position:absolute;top:"+(this.pathPoints[0].y-3+this.surface.borderWidth)+"px;left:"+(this.pathPoints[5].x+3+this.surface.borderWidth)+"px;",
                        "class": "btn",
                        innerHTML:"Share"
                    }, document.body, 'last');

                    var endpoint2Mover = new gfx.Moveable(this.endpoint2);

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

                        this.isMoved = true;

                        var pathPoints = this._getBoxPointsPathForEarChange(this.endpoint2, shift.dx, shift.dy);
                        this.path.setShape(pathPoints.path);

                        if (pathPoints.earLow)
                        {
                            this.txtNode.style.top = (this.pathPoints[5].y+3+this.surface.borderWidth)+'px';
                            this.inputNode.style.top = (this.pathPoints[5].y+3+this.surface.borderWidth)+'px';

                            this.shareBtnNode.style.top = (this.pathPoints[5].y-3+this.surface.borderWidth)+'px';
                        }
                        else
                        {
                            this.txtNode.style.top = (this.pathPoints[0].y+3+this.surface.borderWidth)+'px';
                            this.inputNode.style.top = (this.pathPoints[0].y+3+this.surface.borderWidth)+'px';

                            this.shareBtnNode.style.top = (this.pathPoints[0].y-3+this.surface.borderWidth)+'px';
                        }

                        domStyle.set(dom.byId('btnHome'), 'display', 'none');
                        domStyle.set(dom.byId('btnDraw'), 'display', 'none');
                        domStyle.set(dom.byId('topBar'), 'display', 'none');
                    }));

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

                var boxWidth = vp.w - this.shapePadding*2 - this.shareBtnWidth;
                var leftX = this.shapePadding, rightX = vp.w - this.shapePadding - this.shareBtnWidth;
                var leftY1  = this.startY + this.earHeight, leftY2 = this.startY + this.earHeight+this.boxHeight;

                var x2 = leftX + 50;
                var x3 = x2 + this.earDistance/2;
                var y3 = this.startY;
                var x4 = x2 + this.earDistance;

                if (this.startX)
                {
                    x3 = this.startX;
                    x2 = x3 - this.earDistance/2;
                    x4 = x3 + this.earDistance/2;
                }

                if (this.earLow)
                {
                    leftY1 = y3-(this.earHeight);
                    leftY2 = y3-(this.earHeight+this.boxHeight);
                }

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

                var y3 = cp[2].y = cp[2].y + eY;
                var leftX = cp[0].x, rightX = cp[4].x;
                var x2, x3, x4, mdx = this.path.matrix?this.path.matrix.dx:0;
                var leftY1, leftY2;
                var earLow;

                if ((y3 <= Math.round(this.viewPoint.h/3))||(y3-(this.earHeight+this.boxHeight)) <=0)
                {
                    earLow = false;
                    leftY1 = cp[0].y = y3+(this.earHeight);
                    leftY2 = cp[5].y = y3+(this.earHeight+this.boxHeight);

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
                        x2 = cp[1].x = x3 - this.earDistance/2;
                        x4 = cp[3].x = x3 + this.earDistance/2;
                    }
                }
                else
                {
                    earLow = true;
                    leftY1 = cp[0].y = y3-(this.earHeight);
                    leftY2 = cp[5].y = y3-(this.earHeight+this.boxHeight);

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
                        x2 = cp[1].x = x3 - this.earDistance/2;
                        x4 = cp[3].x = x3 + this.earDistance/2;
                    }
                }

                var path = "M"+leftX+" "+leftY1 + " L"+x2+" "+leftY1+" L"+x3+" "+y3+" L"+x4+" "+leftY1+" L"+rightX+" "+leftY1+
                    " L"+rightX+" "+leftY2+" L"+leftX+" "+leftY2+ " L"+ leftX+" "+leftY1 + " Z";

                this.earLow = earLow;

                return {
                    earLow:earLow,
                    path: path,
                    endpointsPos:[
                        {x: leftX, y: leftY2},
                        {x: x3, y: y3},
                        {x: rightX, y: leftY1}],
                    xPos:{x: rightX-6, y:leftY1-40}
                };
            },
            _getBoxPointsPathForTextChange: function(eY)
            {
                var cp = this.pathPoints;

                var leftY1, leftY2, y3, leftX, rightX, x2, x3, x4;
                if (this.earLow)
                {
                    leftY2 = cp[5].y;
                    y3 = cp[2].y= cp[2].y+eY;
                    leftX = cp[0].x, rightX = cp[4].x;
                    x2 = cp[1].x, x3 = cp[2].x, x4 = cp[3].x;
                    leftY1 = cp[0].y = cp[0].y+eY;

                    this.endpoint2.applyTransform({dy: eY});
                }
                else
                {
                    leftY2 = cp[5].y = cp[5].y+eY;
                    cp[6].y = cp[6].y+eY;
                    y3 = cp[2].y;
                    leftX = cp[0].x, rightX = cp[4].x;
                    x2 = cp[1].x, x3 = cp[2].x, x4 = cp[3].x;
                    leftY1 = cp[0].y;
                }

                this.boxHeight += eY;

                var path = "M"+leftX+" "+leftY1 + " L"+x2+" "+leftY1+" L"+x3+" "+y3+" L"+x4+" "+leftY1+" L"+rightX+" "+leftY1+
                    " L"+rightX+" "+leftY2+" L"+leftX+" "+leftY2+ " L"+ leftX+" "+leftY1 + " Z";

                return {
                    path: path
                };
            },
            getRelativeEarPoint:function()
            {
                var earPoint = this.pathPoints[2];
                var x = Math.round((earPoint.x*10000)/this.viewPoint.w);
                var y = Math.round((earPoint.y*10000)/this.viewPoint.h);
                return {x:x, y:y};
            },
            _isEarMoveable: function(dx, dy)
            {
                return true;
            },
            destroy: function ()
            {
                this.inherited(arguments);

                var surface = this.surface.surface;

                surface.remove(this.path);
                surface.remove(this.endpoint2);

                domConstruct.destroy(this.txtNode);
                domConstruct.destroy(this.inputNode);
                domConstruct.destroy(this.shareBtnNode);
            },
            setSelected: function (sel)
            {
                this.inherited(arguments);
                if (!this.selectable) return;

                /*if (sel)
                 {
                 this.endpoint2.setStroke(this.endpointStrokeStyle).setFill(this.endpointFillStyle);
                 }
                 else
                 {
                 this.endpoint2.setStroke(this.endpointHiddenStrokeStyle).setFill(this.endpointHiddenFillStyle);
                 }*/
            },
            setId: function (id)
            {
                this.inherited(arguments);
            },
            handleBoxHeight: function()
            {
                var textarea = this.inputElement;
                var needHelp = true;

                function textareaScrollHeight(){
                    var empty = false;
                    if(textarea.value === ''){
                        textarea.value = ' ';
                        empty = true;
                    }
                    var sh = textarea.scrollHeight;
                    if(empty){ textarea.value = ''; }
                    return sh;
                }

                if(textarea.style.overflowY == "hidden"){ textarea.scrollTop = 0; }
                if(this.busyResizing){ return; }
                this.busyResizing = true;
                if(textareaScrollHeight() || textarea.offsetHeight){
                    var newH = textareaScrollHeight() + Math.max(textarea.offsetHeight - textarea.clientHeight, 0);

                    if (newH>86)
                    {
                        this.busyResizing = false;
                        textarea.style.overflowY = "auto";
                        return;
                    }
                    var newHpx = newH + "px";
                    if(newHpx != textarea.style.height){
                        textarea.style.height = newHpx;
                        textarea.rows = 1; // rows can act like a minHeight if not cleared
                    }
                    if(needHelp){
                        var	origScrollHeight = textareaScrollHeight(),
                            newScrollHeight = origScrollHeight,
                            origMinHeight = textarea.style.minHeight,
                            decrement = 4, // not too fast, not too slow
                            thisScrollHeight,
                            origScrollTop = textarea.scrollTop;
                        textarea.style.minHeight = newHpx; // maintain current height
                        textarea.style.height = "auto"; // allow scrollHeight to change
                        while(newH > 0){
                            textarea.style.minHeight = Math.max(newH - decrement, 4) + "px";
                            thisScrollHeight = textareaScrollHeight();
                            var change = newScrollHeight - thisScrollHeight;
                            newH -= change;
                            if(change < decrement){
                                break; // scrollHeight didn't shrink
                            }
                            newScrollHeight = thisScrollHeight;
                            decrement <<= 1;
                        }

                        if (newH <=86)
                        {
                            textarea.style.height = newH + "px";
                            textarea.style.minHeight = origMinHeight;
                            textarea.scrollTop = origScrollTop;

                            if (newH != this.lastHeight)
                            {
                                var boxH = newH;
                                if (boxH < this.oneLineHeight) boxH = this.oneLineHeight;
                                domStyle.set(this.txtNode, 'height', boxH+'px');
                                domStyle.set(this.inputNode, 'height', boxH+'px');
                                var pathPoints = this._getBoxPointsPathForTextChange(boxH-this.lastHeight);
                                this.path.setShape(pathPoints.path);

                                this.lastHeight = newH;
                            }
                        }

                    }
                    textarea.style.overflowY = textareaScrollHeight() > textarea.clientHeight ? "auto" : "hidden";
                    if(textarea.style.overflowY == "hidden"){ textarea.scrollTop = 0; }
                }else{
                    // hidden content of unknown size
                    this._estimateHeight();
                }
                this.busyResizing = false;
            },
            _estimateHeight: function(){
                var textarea = this.inputElement;
                // #rows = #newlines+1
                textarea.rows = (textarea.value.match(/\n/g) || []).length + 1;
            }
        });
    });
