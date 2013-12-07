define([
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/string",
    "dojo/_base/connect",
    "dojo/window",
    "dijit/registry",
    "anno/anno/AnnoDataHandler",
    "anno/common/Util",
    "dojo/text!../templates/localAnnoItem.html"
],
    function (dom, domClass, domConstruct, domGeom, domStyle, dojoString, connect, win, registry, AnnoDataHandler, Util, annoItemTemplate)
    {
        var _connectResults = []; // events connect results
        var app = null;

        var loadLocalAnnos = function()
        {
            AnnoDataHandler.loadLocalAnnos(drawAnnos);
        };

        var drawAnnos = function(annos)
        {
            var annoItemList = registry.byId('annoListMyStuff');
            annoItemList.destroyDescendants();

            for (var i= 0,c=annos.length;i<c;i++)
            {
                annos[i].annoIcon = annos[i].anno_type == Util.annoType.DrawComment?"icon-shapes":"icon-simplecomment";
                domConstruct.create("li", {
                    "transition":'slide',
                    "data-dojo-type":"dojox/mobile/ListItem",
                    "data-dojo-props":"variableHeight:true,clickable:true,noArrow:true,_index:"+i,
                    innerHTML: dojoString.substitute(annoItemTemplate, annos[i])
                }, annoItemList.domNode, "last");
            }

            Util.getParser().parse(annoItemList.domNode);

            var items = annoItemList.getChildren();

            for (var i= 0,c=items.length;i<c;i++)
            {
                items[i].annoItem = annos[i];
                items[i].on("click", function(){
                    gotoLocalAnnoViewer(this,this.annoItem);
                });
            }

            if (annos.length <=0)
            {
                domStyle.set('listContainerMyStuff', 'display', 'none');
                domStyle.set('learnHowContainer', 'display', '');
            }
            else
            {
                domStyle.set('listContainerMyStuff', 'display', '');
                domStyle.set('learnHowContainer', 'display', 'none');
            }
        };

        var adjustSize = function()
        {
            var viewPoint = win.getBox();
            var parentBox = domGeom.getMarginBox("headingMyStuff");

            domStyle.set("listContainerMyStuff", "height", (viewPoint.h-parentBox.h)+"px");
        };

        var gotoLocalAnnoViewer = function(annoItem)
        {
            app.transitionToView(annoItem.domNode, {target:'localAnnoViewer',url:'#localAnnoViewer', params:{index:annoItem._index}});
        };

        return {
            // simple view init
            init:function ()
            {
                app = this.app;

                _connectResults.push(connect.connect(dom.byId("btnLearnHow"), 'click', function(e)
                {
                    Util.startActivity("Intro", true);
                }));
            },
            afterActivate: function()
            {
                adjustSize();
                loadLocalAnnos();
            },
            beforeDeactivate: function()
            {

            },
            destroy:function ()
            {
                var connectResult = _connectResults.pop();
                while (connectResult)
                {
                    connect.disconnect(connectResult);
                    connectResult = _connectResults.pop();
                }
            }
        }
    });