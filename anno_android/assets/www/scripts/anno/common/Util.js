define(["dojo/dom-style","dojo/window"], function(domStyle, win){

    var util = {
        loadingIndicator:null,
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
        }
    };

    return util;
});