annoApp.controller("MainCtrl", [
    "$scope",
    "$route",
    "$routeParams",
    "$location",
    function ($scope, $route, $routeParams, $location)
    {
        $scope.$route = $route;
        $scope.$location = $location;
        $scope.$routeParams = $routeParams;
    }]
);

var surface = null;
annoApp.controller("ViewAnnoCtrl", [
    "$scope",
    "$routeParams",
    "AnnoConstants",
    "GAEAPILoader",
    "ComStyleGetter",
    function ($scope, $routeParams, AnnoConstants, GAEAPILoader, ComStyleGetter)
    {
        var annoId = $routeParams.annoId;

        $scope.params = $routeParams;
        $scope.imageWidth = 0;
        $scope.imageHeight = 0;
        $scope.borderWidth = 0;
        $scope.loadingImage = true;
        $scope.loadingDetailData = true;
        $scope.imageBaseURL = AnnoConstants.API.config[AnnoConstants.API.serverURLKey].imageServiceURL;


        $scope.setAnnoData = function (annoData)
        {
            this.annoData = annoData;
            annoData.author = annoData.creator?annoData.creator.display_name||annoData.creator.user_email||annoData.creator.user_id:"";
            annoData.deviceInfo = (annoData.device_model||'\u00A0')+'\u00A0'+(annoData.os_name||'\u00A0')+(annoData.os_version||'\u00A0');

            if (annoData.followup_list)
            {
                for (var j= 0,c=annoData.followup_list.length;j<c;j++)
                {
                    annoData.followup_list[j].user_id = annoData.followup_list[j].creator.display_name||annoData.followup_list[j].creator.user_email||annoData.followup_list[j].creator.id;
                }
            }

            angular.element(byId('loadingIndicatorAnnoData')).css('display', 'none');
            angular.element(byId('textDataAreaContainer')).css('display', '');


            this.$apply();
        };

        $scope.applyAnnoLevelColor = function ()
        {
            var level = this.annoData.level||1;
            if (level == 1)
            {
                angular.element(byId('screenshotContainer')).css({width:(this.imageWidth-this.borderWidth*2)+'px',height:(this.imageHeight-this.borderWidth*2)+'px', 'border-color': AnnoConstants.level1Color,'border-style':'solid', 'border-width':this.borderWidth+'px'});
                angular.element(byId('imgDetailScreenshot')).css({width:'100%',height:'100%'});
            }
            else if (level == 2)
            {
                angular.element(byId('screenshotContainer')).css({width:(this.imageWidth-this.borderWidth*2)+'px',height:(this.imageHeight-this.borderWidth*2)+'px', 'border-color': AnnoConstants.level2Color,'border-style':'solid', 'border-width':this.borderWidth+'px'});
                angular.element(byId('imgDetailScreenshot')).css({width:'100%',height:'100%'});
            }
        };

        $scope.redrawShapes = function()
        {
            var annoData = this.annoData;
            var drawElements = annoData.draw_elements;
            var lineStrokeStyle = {color: annoData.level==1?AnnoConstants.level1Color:AnnoConstants.level2Color, width: 3};
            if (drawElements)
            {
                var elementsObject = angular.fromJson(drawElements);

                surface.show();
                angular.element(surface.container).css({'border': this.borderWidth+'px solid transparent', left:'0px',top:'0px'});

                surface.borderWidth = this.borderWidth;
                surface.setDimensions(this.imageWidth-this.borderWidth*2, this.imageHeight-this.borderWidth*2);

                surface.parse(elementsObject, lineStrokeStyle);

                console.error('redrawShapes end');

                angular.element(byId("screenshotPanel")).css("height", this.imageHeight+'px');
            }
            else
            {
                angular.element(surface.container).css({'border': this.borderWidth+'px solid transparent', left:'0px',top:'0px'});

                surface.borderWidth = this.borderWidth;
                surface.setDimensions(this.imageWidth-this.borderWidth*2, this.imageHeight-this.borderWidth*2);

                surface.clear();
                surface.show();

                var earLow = !annoData.simple_circle_on_top;

                var toolTipDivWidth = (this.imageWidth-this.borderWidth*2-60),
                    pxPerChar = 8,
                    charsPerLine = toolTipDivWidth/pxPerChar;

                var commentText = annoData.anno_text;
                var lines = Math.max(Math.round(commentText.length/charsPerLine),1);

                if (lines > 4 )
                {
                    lines = 4;
                    //var shortText = commentText.substr(0, charsPerLine*4-10)+"...";
                    //commentText = shortText;
                }

                var boxHeight = 34 + (lines-1)*22;
                var epLineStyle, epFillStyle;

                if (annoData.level==1)
                {
                    epLineStyle = {color:AnnoConstants.level1Color, width:1};
                    epFillStyle = "rgba("+AnnoConstants.level1ColorRGB+", 0.4)";
                }
                else
                {
                    epLineStyle = {color:AnnoConstants.level2Color,width:1};
                    epFillStyle = "rgba("+AnnoConstants.level2ColorRGB+", 0.4)";
                }

                var tx = Math.round(((this.imageWidth-this.borderWidth*2)*annoData.simple_x)/10000);
                var ty = Math.round(((this.imageHeight-this.borderWidth*2)*annoData.simple_y)/10000);

                var commentBox = surface.createSimpleCommentBox({
                    deletable:false,
                    startX:tx,
                    startY: ty,
                    selectable:false,
                    shareBtnWidth:0,
                    boxHeight:boxHeight,
                    earLow:earLow,
                    placeholder:commentText,
                    commentText:annoData.anno_text,
                    lineStrokeStyle:lineStrokeStyle,
                    endpointStrokeStyle:epLineStyle,
                    endpointFillStyle:epFillStyle
                });

                angular.element(byId("screenshotPanel")).css("height", this.imageHeight+'px');
            }
        };

        $scope.screenshotLoad = function ()
        {
            angular.element(byId('loadingIndicatorImage')).css('display', 'none');
            angular.element(byId('imgDetailScreenshot')).css('display', '');

            var self = this;
            require(["anno/draw/Surface"], function(Surface){

                self.loadingImage = false;

                var imgScreenshot = byId('imgDetailScreenshot');

                self.imageWidth = parseInt(ComStyleGetter.getComStyle(imgScreenshot).width, 10);
                self.imageHeight = parseInt(ComStyleGetter.getComStyle(imgScreenshot).height, 10);

                self.borderWidth = Math.floor(self.imageWidth * 0.02);

                surface = new Surface({
                    container: byId("gfxCanvasContainer"),
                    width:500,
                    height:500,
                    editable:false,
                    borderWidth:0
                });

                if (!self.loadingDetailData)
                {
                    self.applyAnnoLevelColor();
                    self.redrawShapes();
                }
            });
        };

        GAEAPILoader.loadAPI(AnnoConstants.API.anno, function ()
        {
            var getAnno = gapi.client.anno.anno.get({id: annoId});
            getAnno.execute(function (data)
            {
                if (!data)
                {
                    alert("Annos returned from server are empty.");
                    $scope.loadingDetailData = false;
                    return;
                }

                if (data.error)
                {
                    alert("An error occurred when calling anno.get api: " + data.error.message);
                    $scope.loadingDetailData = false;
                    return;
                }
                console.log(data.result);

                $scope.setAnnoData(data.result);
                $scope.loadingDetailData = false;

                if (!$scope.loadingImage)
                {
                    $scope.applyAnnoLevelColor();
                    $scope.redrawShapes();
                }
            });
        });


    }]
);
