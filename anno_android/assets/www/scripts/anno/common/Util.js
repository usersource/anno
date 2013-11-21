define(["dojo/dom-style","dojo/window"], function(domStyle, win){

    var util = {
        loadingIndicator:null,
        _parser:null,
        annoType: {
            SimpleComment:"simple comment",
            DrawComment:"draw comment"
        },
        level1Color:"#ff9900",
        level2Color:"#ff0000",
        hasConnection: function()
        {
            var networkState = navigator.connection.type;

            if (networkState == "unknown"||networkState == "none")
            {
                return false;
            }
            else
            {
                return true;
            }
        },
        getTimeStamp: function()
        {
            return new Date().getTime();
        },
        getDeviceInfo: function()
        {
            return {
                model: device.model,
                osName:device.platform,
                osVersion:device.version
            };
        },
        getBase64FileContent: function(filePath, callback)
        {
            console.error(filePath);
            localFileSystem.root.getFile(filePath, {create:false,exclusive: false}, function(f){
                f.file(function(e){
                    var reader = new FileReader();
                    reader.onloadend = function (evt)
                    {
                        console.error("file read end");
                        var pos = evt.target.result.lastIndexOf(",");
                        callback(evt.target.result.substr(pos+1));
                    };
                    reader.readAsDataURL(e);
                });

            }, function(e)
            {
                console.error(JSON.stringify(e));
                alert(JSON.stringify(e));
            });
        },
        showLoadingIndicator: function ()
        {
            var cl = this.loadingIndicator;

            if (!cl)
            {
                cl = this.loadingIndicator = new CanvasLoader('', {
                    id: "detail_loading"
                });
                cl.setColor('#302730');
                cl.setDiameter(50);
                cl.setRange(0.9);
            }

            var viewPoint = win.getBox();
            domStyle.set("detail_loading", {
                position: 'absolute',
                left: ((viewPoint.w - 50) / 2) + 'px',
                top: ((viewPoint.h - 50) / 2) + 'px',
                zIndex: 4000
            });

            cl.show();
        },
        hideLoadingIndicator: function ()
        {
            if (this.loadingIndicator)
            {
                this.loadingIndicator.hide();
            }
        },
        getParser: function ()
        {
            if (!this._parser)
            {
                try
                {
                    // returns dojo/parser if loaded, otherwise throws
                    this._parser = require("dojo/parser");
                }
                catch (e)
                {
                    // if here, dojo/parser not loaded
                    try
                    {
                        // returns dojox/mobile/parser if loaded, otherwise throws
                        this._parser = require("dojox/mobile/parser");
                    }
                    catch (e)
                    {
                        // if here, both dojox/mobile/parser and dojo/parser are not loaded
                        console.error("Add explicit require(['dojo/parser']) or explicit require(['dojox/mobile/parser']), one of the parsers is required!");
                    }
                }
            }

            return this._parser;
        },
        startActivity: function(activityName, closeCurrentActivity)
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
                'start_activity',
                [activityName, closeCurrentActivity]
            );
        },
        getAnnoScreenshotPath: function()
        {
            var screenShotPath = "";
            cordova.exec(
                function (result)
                {
                    screenShotPath = result;
                },
                function (err)
                {
                    alert(err);
                },
                "AnnoCordovaPlugin",
                'get_anno_screenshot_path',
                []
            );

            return screenShotPath;
        }
    };

    return util;
});