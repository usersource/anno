define([
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/has",
    "dojo/on",
    "dojo/dom-style",
    "dojo/touch",
    "dojox/gfx",
    "./shapes/ArrowLine",
    "./shapes/Rectangle",
    "./shapes/CommentBox",
    "./shapes/SimpleCommentBox",
    "./shapes/AnonymizedRectangle"
],
    function (
        declare,
        connect,
        lang,
        dom,
        domConstruct,
        has,
        on,
        domStyle,
        touch,
        gfx,
        ArrowLine,
        Rectangle,
        CommentBox,
        SimpleCommentBox,
        AnonymizedRectangle
        )
    {
        /**
         * @author David Lee
         * Surface class, is responsible for creating shapes, handle events
         */
        var safMobile = has("ios");
        return declare("anno.draw.Surface", null, {
            registry:{},
            _g_id: 0,
            drawMode:false,
            editable:true,
            shapeTypes: {
                ArrowLine:"ArrowLine",
                Rectangle:"Rectangle",
                CommentBox:"CommentBox",
                SimpleCommentBox:"SimpleCommentBox",
                AnonymizedRectangle:"AnonymizedRectangle"
            },
            constructor: function(args)
            {
                lang.mixin(this, args);

                this._createSurface();
            },
            _createSurface: function()
            {
                domStyle.set(this.container, {width:this.width+'px', height: this.height+'px'});
                this.surface = gfx.createSurface(this.container, this.width, this.height);

                if (this.editable)
                {
                    var self = this;
                    on(document.body, touch.release,function(e)
                    {
                        if (!self.drawMode) return;
                        self.fixEventTarget(e);
                        if (e.gfxTarget&&e.gfxTarget.isSelectTarget)
                        {
                            var shape = self.getShapeById(e.gfxTarget.sid);

                            if (shape)
                            {
                                self.selectShape(shape);
                            }
                        }
                        else
                        {
                            if (e.gfxTarget&&e.gfxTarget.sid)
                            {
                                self.removeSelection(e.gfxTarget.sid);
                            }
                            else
                            {
                                if (e.target.tagName.toUpperCase() == "SVG")
                                {
                                    self.removeSelection();
                                }
                            }
                        }
                    });

                    connect.connect(this.container, "ondragstart",   dojo, "stopEvent");
                    connect.connect(this.container, "onselectstart", dojo, "stopEvent");
                }
            },
            beforeCreateShape: function(args)
            {
                args.surface = this;
            },
            createArrowLine: function(args)
            {
                this.beforeCreateShape(args);

                var arrow = new ArrowLine(args);
                var id = this._generateShapeId(arrow.shapeType);
                arrow.setId(id);
                this.registry[id] = arrow;

                arrow.createShape(args);
                return arrow;
            },
            createRectangle: function(args)
            {
                this.beforeCreateShape(args);

                var rectangle = new Rectangle(args);
                var id = this._generateShapeId(rectangle.shapeType);
                rectangle.setId(id);
                this.registry[id] = rectangle;

                rectangle.createShape(args);
                return rectangle;
            },
            createAnonymizedRectangle: function(args)
            {
                this.beforeCreateShape(args);

                var rectangle = new AnonymizedRectangle(args);
                var id = this._generateShapeId(rectangle.shapeType);
                rectangle.setId(id);
                this.registry[id] = rectangle;

                rectangle.createShape(args);
                return rectangle;
            },
            createCommentBox: function(args)
            {
                this.beforeCreateShape(args);

                var rectangle = new CommentBox(args);
                var id = this._generateShapeId(rectangle.shapeType);
                rectangle.setId(id);
                this.registry[id] = rectangle;

                rectangle.createShape(args);
                return rectangle;
            },
            createSimpleCommentBox: function(args)
            {
                this.beforeCreateShape(args);

                var rectangle = new SimpleCommentBox(args);
                var id = this._generateShapeId(rectangle.shapeType);
                rectangle.setId(id);
                this.registry[id] = rectangle;

                rectangle.createShape(args);
                return rectangle;
            },
            createImage:function(args)
            {
                this.surface.createImage(args);
            },
            _generateShapeId: function(shapeType)
            {
                this._g_id++;

                return shapeType+"_"+this._g_id;
            },
            getShapeById: function(id)
            {
                return this.registry[id];
            },
            selectShape: function(shape)
            {
                this.removeSelection(shape.id);

                shape.setSelected(true);
                this.selectedShapeId = shape.id;

                if (this.onShapeSelected)
                {
                    this.onShapeSelected(true);
                }
            },
            removeSelection: function(id)
            {
                if (this.selectedShapeId&&this.selectedShapeId!=id)
                {
                    this.getShapeById(this.selectedShapeId)&&this.getShapeById(this.selectedShapeId).setSelected(false);
                    this.selectedShapeId = null;

                    if (this.onShapeSelected)
                    {
                        this.onShapeSelected(false);
                    }
                }
            },
            removeShape: function(shape)
            {
                shape.destroy();

                this.selectedShapeId = null;
                delete this.registry[shape.id];

                if (this.onShapeRemoved)
                {
                    this.onShapeRemoved();
                }

                if (this.onShapeSelected)
                {
                    this.onShapeSelected(false);
                }
            },
            onShapeRemoved: function()
            {
                // fired when a shape removed from surface.
            },
            onShapeSelected: function()
            {
                // fired when a shape was selected.
            },
            hasShapes: function()
            {
                var has = false;

                for (var p in this.registry)
                {
                    has = true;
                    break;
                }

                return has;
            },
            fixEventTarget: function(e)
            {
                if (!e.gfxTarget) {
                    if (safMobile && e.target.wholeText) {
                        // Workaround iOS bug when touching text nodes
                        e.gfxTarget = e.target.parentElement.__gfxObject__;
                    } else {
                        e.gfxTarget = e.target.__gfxObject__;
                    }

                    if (e.target.gfxTarget)
                    {
                        e.gfxTarget = e.target.gfxTarget;
                    }
                }
            },
            switchMode: function(drawMode)
            {
                this.drawMode = drawMode;
            },
            clear: function()
            {
                var shape;
                for (var p in this.registry)
                {
                    shape = this.registry[p];
                    this.removeShape(shape);
                }
            },
            toJSON: function()
            {
                var shape, jsonObject = {};
                for (var p in this.registry)
                {
                    shape = this.registry[p];
                    jsonObject[p] = shape.toJSON();
                }

                return jsonObject;
            },
            getConcatenatedComment: function()
            {
                var shape, comments = [];
                for (var p in this.registry)
                {
                    shape = this.registry[p];

                    if (shape.shapeType == this.shapeTypes.CommentBox)
                    {
                        comments.push(shape.getComment());
                    }
                }

                return comments.join("... ...");
            },
            allCommentFilled: function()
            {
                var shape, ret=true, commentText;
                for (var p in this.registry)
                {
                    shape = this.registry[p];

                    if (shape.shapeType == this.shapeTypes.CommentBox)
                    {
                        commentText = shape.getComment();
                        if (commentText.length <=0)
                        {
                            ret = false;
                            break;
                        }
                    }
                }

                return ret;
            },
            isScreenshotAnonymized: function()
            {
                var anonymized = false;
                for (var p in this.registry)
                {
                    if (this.registry[p].shapeType == this.shapeTypes.AnonymizedRectangle)
                    {
                        anonymized = true;
                    }
                }

                return anonymized;
            },
            parse: function(shapesJson, cbxStrokeStyle)
            {
                this.clear();

                var item;
                for (var p in shapesJson)
                {
                    item = shapesJson[p];

                    if (item.type == this.shapeTypes.ArrowLine)
                    {
                        this.createArrowLine({shapeJson:item, selectable:false});
                    }
                    else if (item.type == this.shapeTypes.Rectangle)
                    {
                        this.createRectangle({shapeJson:item, selectable:false});
                    }
                    /*else if (item.type == this.shapeTypes.AnonymizedRectangle)
                    {
                        this.createAnonymizedRectangle({shapeJson:item, selectable:false});
                    }*/
                    else if (item.type == this.shapeTypes.CommentBox)
                    {
                        this.createCommentBox({shapeJson:item, selectable:false, lineStrokeStyle:cbxStrokeStyle});
                    }

                }
            },
            setDimensions: function(width, height)
            {
                this.width = width;
                this.height = height;

                domStyle.set(this.container, {width:this.width+'px', height: this.height+'px'});
                this.surface.setDimensions(this.width+'px', this.height+'px');
            },
            hide: function()
            {
                domStyle.set(this.container, 'display', 'none');
            },
            show: function()
            {
                domStyle.set(this.container, 'display', '');
            }
        });
    });
