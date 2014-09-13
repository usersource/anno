var GAEServices = angular.module('AnnoServices', ['AnnoConstantsModule']);

GAEServices.factory('GAEAPILoader', ["AnnoConstants", function (AnnoConstants)
{
    return {
        loadAPI: function (apiId, callback, errorCallback)
        {
            var self = this;
            if (window.gapi&&gapi.client)
            {
                gapi.client.load(apiId, AnnoConstants.API.apiVersion, function(res) {

                    if (res&&res.error)
                    {
                        console.error(apiId+" API load failed.");

                        if (errorCallback)
                        {
                            errorCallback();
                        }
                        else
                        {
                            alert('Load '+apiId+" API failed, "+res.error.message);
                        }
                    }
                    else
                    {
                        console.error(apiId+" API loaded.");
                        callback();
                    }
                }, AnnoConstants.API.config[AnnoConstants.API.serverURLKey].apiRoot);
            }
            else
            {
                window.setTimeout(function(){
                    self.loadAPI(apiId, callback, errorCallback);
                }, 50)
            }
        }
    };
}]);

GAEServices.factory('ComStyleGetter', function ()
{
    var userAgentUtil = {
        initialized:false,
        /**
         * detect user agent attributes
         */
        init: function()
        {
            var n = navigator,
                dua = n.userAgent,
                dav = n.appVersion,tv = parseFloat(dav);

            this.webkit = parseFloat(dua.split("WebKit/")[1]) || undefined;
            this.khtml = dav.indexOf("Konqueror") >= 0 ? tv : undefined;
            this.mac = dav.indexOf("Macintosh") >= 0;
            this.ios = /iPhone|iPod|iPad/.test(dua);
            this.android = parseFloat(dua.split("Android ")[1]) || undefined;
            this.bb = (dua.indexOf("BlackBerry") >= 0 || dua.indexOf("BB10") >=0)?parseFloat(dua.split("Version/")[1]) || undefined:undefined;

            this.chrome = parseFloat(dua.split("Chrome/")[1]) || undefined;
            this.safari = dav.indexOf("Safari")>=0 && !this.chrome ? parseFloat(dav.split("Version/")[1]) : undefined;

            if (this.chrome) this.chrome = Math.floor(this.chrome);
            if (this.safari) this.safari = Math.floor(this.safari);
            if (this.bb) this.bb = Math.floor(this.bb);

            if (!this.webkit)
            {
                if (dua.indexOf("Opera") >= 0)
                {
                    this.opera = tv >= 9.8 ? parseFloat(dua.split("Version/")[1]) || tv : tv;
                    this.opera = Math.floor(this.opera);
                }

                if (dua.indexOf("Gecko") >= 0 && !this.khtml && !this.webkit)
                {
                    this.mozilla = tv;
                }
                if (this.mozilla)
                {
                    this.ff = parseFloat(dua.split("Firefox/")[1] || dua.split("Minefield/")[1]) || undefined;

                    if (this.ff) this.ff = Math.floor(this.ff);
                }

                if (document.all && !this.opera)
                {
                    var isIE = parseFloat(dav.split("MSIE ")[1]) || undefined;

                    var mode = document.documentMode;
                    if (mode && mode != 5 && Math.floor(isIE) != mode)
                    {
                        isIE = mode;
                    }

                    this.ie = isIE;
                }
            }

            if (dua.match(/(iPhone|iPod|iPad)/))
            {
                var p = RegExp.$1.replace(/P/, 'p');
                var v = dua.match(/OS ([\d_]+)/) ? RegExp.$1 : "1";
                var os = parseFloat(v.replace(/_/, '.').replace(/_/g, ''));
                this[p] = os;
            }

            this.initialized = true;
        }
    };

    userAgentUtil.init();

    var getComputedStyle;
    if(userAgentUtil["webkit"]){
        getComputedStyle = function(/*DomNode*/ node){
            var s;
            if(node.nodeType == 1){
                var dv = node.ownerDocument.defaultView;
                s = dv.getComputedStyle(node, null);
                if(!s && node.style){
                    node.style.display = "";
                    s = dv.getComputedStyle(node, null);
                }
            }
            return s || {};
        };
    }else if(userAgentUtil["ie"] && (userAgentUtil["ie"] < 9 || userAgentUtil["quirks"])){
        getComputedStyle = function(node){
            // IE (as of 7) doesn't expose Element like sane browsers
            // currentStyle can be null on IE8!
            return node.nodeType == 1 /* ELEMENT_NODE*/ && node.currentStyle ? node.currentStyle : {};
        };
    }else{
        getComputedStyle = function(node){
            return node.nodeType == 1 /* ELEMENT_NODE*/ ?
                node.ownerDocument.defaultView.getComputedStyle(node, null) : {};
        };
    }

    return {
        getComStyle: getComputedStyle
    };
});

