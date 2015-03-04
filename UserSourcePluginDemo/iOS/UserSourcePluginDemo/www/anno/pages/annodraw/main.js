require([
    "anno/draw/Surface",
    "dojo/_base/connect",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/json",
    "dojo/query",
    "dojo/ready",
    "dojo/touch",
    "dojo/window",
    "dijit/registry",
    "anno/common/DBUtil",
    "anno/common/Util",
    "anno/common/OAuthUtil",
    "anno/anno/AnnoDataHandler",
    "dojo/domReady!"
], function (Surface, connect, dom, domClass, domGeom, domStyle, dojoJson, query, ready, touch, win, registry, DBUtil, annoUtil, OAuthUtil, AnnoDataHandler)
{
    var viewPoint,
        defaultShapeWidth = 160,
        defaultShapeHeight = 80,
        shareDialogGap = 40,
        borderWidth;

    var sdTitleHeight = 60, sdTabBarHeight = 30,
        sdBottom = 50, barHeight = dom.byId('bottomBarContainer').clientHeight, totalSpace = 0;

    var lastShapePos;
    var lastBlackRectanglePos;

    var surface, drawMode = false;
    var defaultCommentBox;

    var selectedAppName, screenShotPath, selectedAppVersionName, selectedType = "app";
    var level = 1;
    var isAnno = false, appNameListFetched = false;
    var editMode = false, editAppName = "", editAppVersionName = "",
        editAnnoId = "",
        originalGrayBoxes,
        originalGrayBoxCnt = 0,
        editDrawElementsJson = "";
    var favoriteApps, favoriteAppsFetched, appNameList = [];

    var appListDom = '<div class="appNameItem"><div class="appNameValue" data-type="{type}" data-app-version="{versionName}">{appName}</div></div>';

    connect.connect(dom.byId("barArrow"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barArrow"), 'barIconInactive')) return;

        var lineStrokeStyle = {
            color : level == 1 ? annoUtil.level1Color : annoUtil.level2Color,
            width : annoUtil.annotationWidth
        };

        var arrowHeadFillStyle = level == 1 ? annoUtil.level1Color : annoUtil.level2Color;

        var arrowLine = surface.createArrowLine({
            x1 : lastShapePos.x1,
            y1 : lastShapePos.y1,
            x2 : lastShapePos.x2,
            y2 : lastShapePos.y2,
            level : level,
            lineStrokeStyle : lineStrokeStyle,
            arrowHeadFillStyle : arrowHeadFillStyle
        });

        updateLastShapePos(arrowLine.shapeType);
    });

    connect.connect(dom.byId("barRectangle"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barRectangle"), 'barIconInactive')) return;

        var lineStrokeStyle = {
            color : level == 1 ? annoUtil.level1Color : annoUtil.level2Color,
            width : annoUtil.annotationWidth
        };

        var rectangle = surface.createRectangle({
            startX : lastShapePos.x1,
            startY : lastShapePos.y1 - defaultShapeHeight - 50,
            width : defaultShapeWidth,
            height : defaultShapeHeight,
            level : level,
            lineStrokeStyle : lineStrokeStyle
        });

        updateLastShapePos(rectangle.shapeType);
    });

    connect.connect(dom.byId("barComment"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barComment"), 'barIconInactive')) return;

        var lineStrokeStyle = {
            color : level == 1 ? annoUtil.level1Color : annoUtil.level2Color,
            width : annoUtil.annotationWidth
        };

        var commentBox = surface.createCommentBox({
            startX : lastShapePos.x1,
            startY : lastShapePos.y1 - defaultShapeHeight - 50,
            width : defaultShapeWidth,
            height : defaultShapeHeight,
            lineStrokeStyle : lineStrokeStyle,
            level : level
        });

        updateLastShapePos('Rectangle');

        commentBox.onCommentBoxInput = onCommentBoxInput;
        commentBox.onCommentBoxFocus = onCommentBoxFocus;
        commentBox.onCommentBoxBlur = showBottomNavBar;

        checkBarShareState();
    });

    connect.connect(dom.byId("barShare"), "click", function()
    {
        if (domClass.contains(dom.byId("barShare"), 'barIconInactive')) return;
        domClass.add(dom.byId("barShare"), 'barIconInactive');

        if (editMode)
        {
            if (level == 2 || !isAnno)
            {
                updateDrawCommentAnno();
            }
            else
            {
                openShareDialog();
            }
        }
        else
        {
            if (level == 2 || !isAnno)
            {
                if (drawMode)
                {
                    insertDrawCommentAnno();
                }
                else
                {
                    insertSimpleCommentAnno();
                }
            }
            else
            {
                openShareDialog();
            }
        }
    });

    connect.connect(dom.byId("txtAppName"), 'keydown', function(e)
    {
        if (e.keyCode == 13)
        {
            dom.byId("hiddenBtn").focus();
            dom.byId("hiddenBtn").click();
        }
    });

    connect.connect(dom.byId("barBlackRectangle"), touch.release, function()
    {
        if (domClass.contains(dom.byId("barBlackRectangle"), 'barIconInactive')) return;

        createBlackRectangle();
    });

    // handle app name list click event
    connect.connect(dom.byId("sdAppList"), 'click', function(e)
    {
        var itemNode = e.target;

        if (domClass.contains(itemNode, 'appNameValue'))
        {
            itemNode = itemNode.parentNode;
        }

        if (!domClass.contains(itemNode, 'appNameItem'))
        {
            return;
        }

        var allItems = query('.appNameItem', dom.byId("sdAppList"));

        for (var i=0;i<allItems.length;i++)
        {
            domClass.remove(allItems[i], 'appNameItem-active');

            if (allItems[i].children[0].tagName == "INPUT")
            {
                domStyle.set(allItems[i].children[0], "color", "white");
            }
        }

        domClass.add(itemNode, 'appNameItem-active');

        if (itemNode.children[0].tagName == "INPUT")
        {
            domStyle.set(itemNode.children[0], "color", "#ff9900");
            selectedAppName = itemNode.children[0].innerHTML;
            selectedAppVersionName = "";
            selectedType = itemNode.children[0].getAttribute('data-type');
        }
        else
        {
            selectedAppName = itemNode.children[0].innerHTML;
            selectedAppVersionName = itemNode.children[0].getAttribute('data-app-version');
            selectedType = itemNode.children[0].getAttribute('data-type');
        }

        dom.byId("btnShare").disabled = false;
        domClass.remove("btnShare", "disabledBtn");
    });

    // share button
    connect.connect(dom.byId("btnShare"), 'click', function(e)
    {
        registry.byId('shareDialog').hide();

        // enable JS gesture listener, disable native gesture
        // annoUtil.enableJSGesture();
        // annoUtil.disableNativeGesture();

        if (editMode)
        {
            updateDrawCommentAnno();
        }
        else
        {
            if (drawMode)
            {
                insertDrawCommentAnno();
            }
            else
            {
                insertSimpleCommentAnno();
            }
        }

    });

    // home/feeds/cancel button
    /*connect.connect(dom.byId("menuItemFeed"), 'click', function(e)
    {
        var action = "goto_anno_home";

        window.localStorage.setItem(annoUtil.localStorageKeys.editAnnoDone, "cancel");

        cordova.exec(
            function (result)
            {

            },
            function (err)
            {
                annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
            },
            "AnnoCordovaPlugin",
            action,
            []
        );
    });*/

    /*connect.connect(dom.byId("menuItemCancel"), 'click', function(e)
    {
        var action = "exit_current_activity";
        window.localStorage.setItem(annoUtil.localStorageKeys.editAnnoDone, "cancel");

        cordova.exec(
            function (result)
            {

            },
            function (err)
            {
                annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
            },
            "AnnoCordovaPlugin",
            action,
            []
        );
    });*/

    // app tabs
    connect.connect(dom.byId("barFavoriteApps"), 'click', function(e)
    {
        if (domClass.contains(dom.byId('barFavoriteApps').parentNode, 'active'))
        {
            return;
        }

        domClass.add(dom.byId('barFavoriteApps').parentNode, 'active');
        domClass.remove(dom.byId('barRecentApps').parentNode);
        domClass.remove(dom.byId('barElseApps').parentNode);

        domStyle.set('sdRecentAppsListContent', 'display', 'none');
        domStyle.set('sdElseAppListContent', 'display', 'none');
        domStyle.set('sdFavoriteAppsListContent', 'display', '');
    });

    connect.connect(dom.byId("barRecentApps"), 'click', function(e)
    {
        if (domClass.contains(dom.byId('barRecentApps').parentNode, 'active'))
        {
            return;
        }

        domClass.add(dom.byId('barRecentApps').parentNode, 'active');
        domClass.remove(dom.byId('barFavoriteApps').parentNode);
        domClass.remove(dom.byId('barElseApps').parentNode);

        domStyle.set('sdFavoriteAppsListContent', 'display', 'none');
        domStyle.set('sdElseAppListContent', 'display', 'none');
        domStyle.set('sdRecentAppsListContent', 'display', '');
    });

    connect.connect(dom.byId("barElseApps"), 'click', function(e)
    {
        if (domClass.contains(dom.byId('barElseApps').parentNode, 'active'))
        {
            return;
        }

        domClass.add(dom.byId('barElseApps').parentNode, 'active');
        domClass.remove(dom.byId('barFavoriteApps').parentNode);
        domClass.remove(dom.byId('barRecentApps').parentNode);

        domStyle.set('sdRecentAppsListContent', 'display', 'none');
        domStyle.set('sdFavoriteAppsListContent', 'display', 'none');
        domStyle.set('sdElseAppListContent', 'display', '');
    });

    var openShareDialog = function()
    {
        adjustShareDialogSize();
        registry.byId('shareDialog').show();

        // disable JS gesture listener, enable native gesture listener
        // annoUtil.disableJSGesture();
        // annoUtil.enableNativeGesture();

        if (!appNameListFetched&&annoUtil.isAndroid())
        {
            cordova.exec(
                function (result)
                {
                    result = result || [];

                    cordova.exec(
                        function (installedApps)
                        {
                            appNameListFetched = true;
                            if (installedApps&&installedApps.length>0)
                            {
                                appNameList = installedApps;

                                // DON'T SORT RECENT APPS
                                /* // sort the app array by name
                                result.sort(function (a, b){
                                    return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
                                });*/

                                // make a copy of recent apps
                                var recentAppPlainList = [];
                                for (var i= 0,c=result.length;i<c;i++)
                                {
                                    recentAppPlainList.push(result[i].name);
                                }

                                installedApps = installedApps.filter(function(item){
                                    return recentAppPlainList.indexOf(item.name) < 0;
                                });

                                installedApps.sort(function (a, b){
                                    return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
                                });

                                // add "recent" separator
                                addAppListSeparator("recent", "sdRecentAppsListContent");
                                fillNameList(result, "sdRecentAppsListContent", true);
                                // add "installed" separator
                                addAppListSeparator("installed", "sdRecentAppsListContent");
                                fillNameList(installedApps, "sdRecentAppsListContent", true);
                            }
                        },
                        function (err)
                        {
                            annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
                        },
                        "AnnoCordovaPlugin",
                        'get_installed_app_list',
                        []
                    );
                },
                function (err)
                {
                    annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
                },
                "AnnoCordovaPlugin",
                'get_recent_applist',
                [10]
            );
        }

        if (!favoriteAppsFetched)
        {
            loadCommunities(function(communityList){
                favoriteAppsFetched = true;
                var listCommunities = [];

                for (var i= 0,c=communityList.length;i<c;i++)
                {// todo: get version from community?
                    listCommunities.push({versionName:"", name:communityList[i].community.name});
                }

                listCommunities.sort(function (a, b){
                    return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
                });

                // add "teams" separator
                addAppListSeparator("Teams", "sdFavoriteAppsListContent");
                fillNameList(listCommunities, "sdFavoriteAppsListContent", true, "community");

                loadFavoriteApps(function(favoriteApps){
                    var listCommunitiesPlainList = [];
                    for (var i= 0,c=listCommunities.length;i<c;i++)
                    {
                        listCommunitiesPlainList.push(listCommunities[i].name);
                    }

                    favoriteApps = favoriteApps.filter(function(item){
                        return listCommunitiesPlainList.indexOf(item.name) < 0;
                    });

                    // DON'T SORT FAVORITE APPS
                    /*favoriteApps.sort(function (a, b){
                        return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
                    });*/

                    var list = [];

                    for (var i= 0,c=favoriteApps.length;i<c;i++)
                    {
                        list.push({versionName:favoriteApps[i].version||"", name:favoriteApps[i].name});
                    }

                    list = removeDuplicatesAppsItems(list);

                    // add "Apps" separator
                    addAppListSeparator("Apps", "sdFavoriteAppsListContent");
                    fillNameList(list, "sdFavoriteAppsListContent", true);

                    // no teams and no favorites, then list all installed apps on Android
                    if (favoriteApps.length <=0 && communityList.length <=0)
                    {
                        if (annoUtil.isAndroid())
                        {
                            domStyle.set(dom.byId("barFavoriteApps").parentNode, "display", "none");
                            dom.byId("barRecentApps").parentNode.setAttribute("width", "50%");
                            dom.byId("barElseApps").parentNode.setAttribute("width", "50%");

                            dom.byId('barRecentApps').click();
                        }
                        else
                        {
                            // highlight 'something else' tab on iOS
                            dom.byId('barElseApps').click();
                            domStyle.set("tabContainer", "display", "none");
                            // domStyle.set('sdAppList', 'height', (viewPoint.h - sdTitleHeight - sdBottom - shareDialogGap) + 'px');
                        }
                    }
                });
            });
        }

        var tabBox = domGeom.getMarginBox('tabContainer');
        // domStyle.set('sdAppList', 'height', (viewPoint.h - sdTitleHeight - tabBox.h - sdBottom - shareDialogGap) + 'px');
    };

    var fillNameList = function(appList, appContentId, append, type) {
        var content = append ? dom.byId(appContentId).innerHTML : "";
        type = type || "app";

        for (var i = 0, c = appList.length; i < c; i++) {
            var app = appListDom.replace("{type}", type);
            app = app.replace("{versionName}", appList[i].versionName);
            app = app.replace("{appName}", appList[i].name);
            content = content + app;
        }

        dom.byId(appContentId).innerHTML = content;
    };

    var addAppListSeparator = function(label, parentDiv) {
        var content = dom.byId(parentDiv).innerHTML;
        content = content + '<div class="appSeparatorItem"><div class="appNameValue">' + label.toUpperCase() + '</div></div>';
        dom.byId(parentDiv).innerHTML = content;
    };

    var removeDuplicatesAppsItems = function (appsList) {
        var i, j, cur, found;
        for (i = appsList.length - 1; i >= 0; i--) {
            cur = appsList[i];
            found = false;
            for (j = i - 1; !found && j >= 0; j--) {
                if (cur.name == appsList[j].name) {
                    if (i !== j) {
                        appsList.splice(i, 1);
                    }
                    found = true;
                }
            }
        }
        return appsList;
    };

    var updateLastShapePos = function(shapeType)
    {
        if (shapeType == "ArrowLine")
        {
            lastShapePos.y1+= 50;
            lastShapePos.y2+= 50;
        }
        else if (shapeType == "Rectangle")
        {
            lastShapePos.y1+= defaultShapeHeight+50;
            lastShapePos.y2+= defaultShapeHeight+50;
        }

        if (lastShapePos.y1 >= (viewPoint.h-barHeight)||lastShapePos.y2 >= (viewPoint.h-barHeight))
        {
            lastShapePos.y1 = 100+defaultShapeHeight;
            lastShapePos.y2 = 100;
        }
    };

    var toLeft = false;
    var updateLastBlackRectanglePos = function()
    {
        if (toLeft)
        {
            lastBlackRectanglePos.x1-= 100;
            lastBlackRectanglePos.y1+= defaultShapeHeight+50;
            lastBlackRectanglePos.y2+= defaultShapeHeight+50;
        }
        else
        {
            lastBlackRectanglePos.x1+= 100;
            lastBlackRectanglePos.y1+= defaultShapeHeight+50;
            lastBlackRectanglePos.y2+= defaultShapeHeight+50;
        }

        if (lastBlackRectanglePos.y1 >= (viewPoint.h-barHeight)||lastBlackRectanglePos.y2 >= (viewPoint.h-barHeight))
        {
            lastBlackRectanglePos.y1 = 100+defaultShapeHeight;
            lastBlackRectanglePos.y2 = 100;
        }

        if ((lastBlackRectanglePos.x1+defaultShapeWidth) >= (viewPoint.w))
        {
            lastBlackRectanglePos.x1 = lastBlackRectanglePos.x1 - 30 - ((lastBlackRectanglePos.x1+defaultShapeWidth) - viewPoint.w);
        }

        if ((lastBlackRectanglePos.x1) <0 )
        {
            lastBlackRectanglePos.x1 = 30;
        }

        toLeft = !toLeft;
    };

    var createBlackRectangle = function()
    {
        var rectangle = surface.createAnonymizedRectangle({
            startX: lastBlackRectanglePos.x1,
            startY: lastBlackRectanglePos.y1 - defaultShapeHeight - 50,
            width: defaultShapeWidth,
            height: defaultShapeHeight,
            level: level
        });

        updateLastBlackRectanglePos();
    };

    var switchMode = function(mode)
    {
        drawMode = true;
        var lineStrokeStyle = {
            color : level == 1 ? annoUtil.level1Color : annoUtil.level2Color,
            width : annoUtil.annotationWidth
        };
        var arrowHeadFillStyle = level == 1 ? annoUtil.level1Color : annoUtil.level2Color;
        var drawElements, drawItem, commentBox;

        if (editMode)
        {
            originalGrayBoxes = {};
            originalGrayBoxCnt = 0;
            drawElements = dojoJson.parse(editDrawElementsJson);

            surface.switchMode(true);
            surface.parse(drawElements, lineStrokeStyle, arrowHeadFillStyle, true, level);

            for (var p in drawElements)
            {
                drawItem = drawElements[p];

                if (drawItem.type == surface.shapeTypes.AnonymizedRectangle)
                {
                    originalGrayBoxes[p] = drawItem;
                    originalGrayBoxCnt++;
                }
            }

            for (var p in surface.registry)
            {
                commentBox = surface.registry[p];

                if (commentBox.shapeType == surface.shapeTypes.CommentBox)
                {
                    commentBox.onCommentBoxInput = onCommentBoxInput;
                    commentBox.onCommentBoxFocus = onCommentBoxFocus;
                    commentBox.onCommentBoxBlur = showBottomNavBar;
                }
            }

            checkBarShareState();
        }
        else
        {
            // create default comment box
            commentBox = surface.createCommentBox({
                deletable : false,
                startX : lastShapePos.x1,
                startY : lastShapePos.y1 - defaultShapeHeight - 50,
                width : defaultShapeWidth,
                height : defaultShapeHeight,
                lineStrokeStyle : lineStrokeStyle,
                level: level
            });

            updateLastShapePos('Rectangle');
            surface.switchMode(true);

            window.setTimeout(function(){
                commentBox.animateEarControl();
            }, 500);

            commentBox.onCommentBoxInput = onCommentBoxInput;
            commentBox.onCommentBoxFocus = onCommentBoxFocus;
            commentBox.onCommentBoxBlur = showBottomNavBar;
        }
    };

    var showBottomNavBar = function()
    {
        window.setTimeout(function(){
            domStyle.set("bottomBarContainer", "display", "");
            domStyle.set("annoDrawSuggestedTags", "display", "none");
        }, 500);
    };

    var onCommentBoxInput = function(commentBox, event) {
        checkBarShareState();
        window.setTimeout(function() {
            annoUtil.showTextSuggestion("annoDrawSuggestedTags", commentBox.inputElement.id);
        }, 0);
    };

    var onCommentBoxFocus = function() {
        hideBottomNavBar();
    };

    /*var setSuggestTagDivDimensions = function() {
        var canvasContainerClientRect = dom.byId('gfxCanvasContainer').getBoundingClientRect(),
            targetClientRect = event.target.getBoundingClientRect(),
            positionTop = (targetClientRect.top - canvasContainerClientRect.top) + targetClientRect.height,
            suggestedTagsHeight = 92; // height of annoDrawSuggestedTags
        if ((positionTop + suggestedTagsHeight) > canvasContainerClientRect.height) {
            positionTop -= ((targetClientRect.height + 10) + suggestedTagsHeight);
        }
        domStyle.set("annoDrawSuggestedTags", "top", positionTop + "px");
    };*/

    var hideBottomNavBar = function()
    {
        domStyle.set("bottomBarContainer", "display", "none");
    };

    var drawImageHiddenCanvas = function()
    {
        var hiddenCanvas = dom.byId('hiddenCanvas');
        hiddenCanvas.width = viewPoint.w-totalSpace*2;
        hiddenCanvas.height = viewPoint.h-borderWidth*2-barHeight;
        var ctx = hiddenCanvas.getContext('2d');
        var hiddenImage = new Image();
        hiddenImage.onload = function()
        {
            ctx.drawImage(hiddenImage, 0, 0, viewPoint.w-totalSpace*2, viewPoint.h-borderWidth*2-barHeight);
        };

        if (editMode)
        {
            hiddenImage.src = window.localStorage.getItem(annoUtil.localStorageKeys.currentImageData);
            window.setTimeout(function(){
                window.localStorage.removeItem(annoUtil.localStorageKeys.currentImageData);
            }, 5000);
        }
        else
        {
            hiddenImage.src = screenShotPath;
        }
    };

    var initBackgroundImage = function()
    {
        if (cordova.exec)
        {
            cordova.exec(
                function (result)
                {
                    if (result)
                    {
                        screenShotPath = result.screenshotPath;
                        level = result.level;
                        isAnno = result.isAnno;
                        editMode = result.editMode;

                        if (editMode)
                        {
                            dom.byId('imageScreenshot').src = window.localStorage.getItem(annoUtil.localStorageKeys.currentImageData);
                            var currentAnnoData = dojoJson.parse(window.localStorage.getItem(annoUtil.localStorageKeys.currentAnnoData));

                            level = currentAnnoData.level;
                            editAnnoId = currentAnnoData.id;
                            editAppName = currentAnnoData.app;
                            editAppVersionName = currentAnnoData.appVersion;
                            editDrawElementsJson = currentAnnoData.draw_elements;

                            window.localStorage.removeItem(annoUtil.localStorageKeys.currentAnnoData);

                            dom.byId("btnShare").disabled = false;
                            domClass.remove("btnShare", "disabledBtn");
                        }
                        else
                        {
                            dom.byId('imageScreenshot').src = screenShotPath;
                        }

                        if (level == 1)
                        {
                            domStyle.set('screenshotContainer', 'borderColor', annoUtil.level1Color);
                        }
                        else
                        {
                            domStyle.set('screenshotContainer', 'borderColor', annoUtil.level2Color);
                        }

                        window.setTimeout(function()
                        {
                            switchMode(true);
                            adjustShareDialogSize();
                            drawImageHiddenCanvas();
                        }, 1000);
                    }
                    else
                    {
                        window.setTimeout(initBackgroundImage, 50);
                    }
                },
                function (err)
                {
                    annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
                },
                "AnnoCordovaPlugin",
                'get_screenshot_path',
                []
            );
        }
        else
        {
            window.setTimeout(initBackgroundImage, 50);
        }

    };

    var adjustShareDialogSize = function()
    {
        viewPoint = win.getBox();

        if (level == 1)
        {
            if (isAnno)
            {
                // set share dialog size
                domStyle.set('shareDialog', {
                    width: (viewPoint.w-shareDialogGap)+'px',
                    height: (viewPoint.h-shareDialogGap)+'px'
                });
            }
            else
            {
                domStyle.set('sdAppList','display','none');
                domStyle.set('sdTitle','display','none');
                domStyle.set('sdShareBtn','paddingTop','18px');
                domStyle.set('sdBottom',{
                    'paddingTop':'45px'
                });


                // set share dialog size
                domStyle.set('shareDialog', {
                    width: '300px',
                    height: '150px'
                });
            }

        }
        else
        {
            domStyle.set('sdAppList','display','none');
            domStyle.set('sdTitle','display','none');
            domStyle.set('sdShareBtn','paddingTop','18px');
            domStyle.set('sdBottom',{
                'paddingTop':'45px'
            });


            // set share dialog size
            domStyle.set('shareDialog', {
                width: '300px',
                height: '150px'
            });
        }
    };

    var insertSimpleCommentAnno = function()
    {
        var commentText = defaultCommentBox.inputElement.value;

        if (commentText.length <=0)
        {
            // alert("Please enter suggestion.");
            annoUtil.showMessageDialog("Please enter suggestion.");
            return;
        }

        var appName = selectedAppName, appVersion;
        if (appName)
        {
            appVersion = selectedAppVersionName;
        }
        else
        {
            appName = dom.byId("txtAppName").value.trim();
            if (appName)
            {
                appVersion = "";
            }
            else
            {
                appName = "";
            }
        }

        annoUtil.showLoadingIndicator();

        var deviceInfo = annoUtil.getDeviceInfo();
        var pluginParam = [], isScreenshotAnonymized = surface.isScreenshotAnonymized();

        if (isScreenshotAnonymized)
        {
            pluginParam[0] = outputImage();
        }

        cordova.exec(
            function (result)
            {
                var imageKey = result.imageAttrs.imageKey;
                var screenshotDirPath = result.imageAttrs.screenshotPath;
                var appInfo = result.appInfo;
                var screenInfo = result.screenInfo;

                var earPoint = defaultCommentBox.getRelativeEarPoint();

                var annoItem = {
                    "anno_text":defaultCommentBox.inputElement.value,
                    "image":imageKey,
                    // "simple_x":earPoint.x,
                    // "simple_y":earPoint.y,
                    // "simple_circle_on_top":!defaultCommentBox.earLow,
                    "app_version":appVersion||appInfo.appVersion,
                    // "simple_is_moved":defaultCommentBox.isMoved,
                    "level":appInfo.level,
                    "app_name":appName||appInfo.appName,
                    "device_model":deviceInfo.model,
                    "os_name":deviceInfo.osName,
                    "os_version":deviceInfo.osVersion,
                    "anno_type":"simple comment",
                    "screenshot_is_anonymized":isScreenshotAnonymized,
                    "screenInfo":screenInfo
                };

                AnnoDataHandler.insertAnno(annoItem, appInfo.source, screenshotDirPath);
            },
            function (err)
            {
                annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
            },
            "AnnoCordovaPlugin",
            'process_image_and_appinfo',
            pluginParam
        );
    };

    var insertDrawCommentAnno = function()
    {
        if (!surface.allCommentFilled())
        {
            annoUtil.showMessageDialog("Please enter suggestion.");
            return;
        }

        var appName = selectedAppName, appVersion;
        if (appName)
        {
            appVersion = selectedAppVersionName;
        }
        else
        {
            appName = dom.byId("txtAppName").value.trim();
            if (appName)
            {
                appVersion = "none";
            }
            else
            {
                appName = "";
            }
        }

        annoUtil.showLoadingIndicator();

        var deviceInfo = annoUtil.getDeviceInfo();
        console.log(JSON.stringify(deviceInfo));

        var pluginParam = [], isScreenshotAnonymized = surface.isScreenshotAnonymized();

        if (isScreenshotAnonymized)
        {
            pluginParam[0] = outputImage();
        }

        cordova.exec(
            function (result)
            {
                var imageKey = result.imageAttrs.imageKey;
                var screenshotDirPath = result.imageAttrs.screenshotPath;
                var appInfo = result.appInfo;
                var screenInfo = result.screenInfo;

                var annoItem = {
                    "anno_text":surface.getConcatenatedComment(),
                    "image":imageKey,
                    // "simple_x":0,
                    // "simple_y":0,
                    // "simple_circle_on_top":false,
                    // "simple_is_moved":false,
                    "level":appInfo.level,
                    "device_model":deviceInfo.model,
                    "os_name":deviceInfo.osName,
                    "os_version":deviceInfo.osVersion,
                    "draw_elements":dojoJson.stringify(surface.toJSON()),
                    "screenshot_is_anonymized":isScreenshotAnonymized,
                    "anno_type":"draw comment",
                    "team_key":annoUtil.pluginTeamKey||"",
                    "screen_info":screenInfo
                };

                if (selectedType == "app") {
                    annoItem["app_name"] = appName || appInfo.appName;
                    annoItem["app_version"] = appVersion == "none" ? "" : appVersion || appInfo.appVersion;
                } else if (selectedType == "community") {
                    annoItem["community_name"] = appName || appInfo.appName;
                }

                AnnoDataHandler.insertAnno(annoItem, appInfo.source, screenshotDirPath);
            },
            function (err)
            {
                annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
            },
            "AnnoCordovaPlugin",
            'process_image_and_appinfo',
            pluginParam
        );
    };

    var updateDrawCommentAnno = function()
    {
        if (!surface.allCommentFilled())
        {
            annoUtil.showMessageDialog("Please enter suggestion.");
            return;
        }

        annoUtil.showLoadingIndicator();

        var pluginParam = [], isScreenshotAnonymized = surface.isScreenshotAnonymized(),
            shapesJson = surface.toJSON();
        var appName = selectedAppName||dom.byId("txtAppName").value.trim()||editAppName;

        var appName = selectedAppName, appVersion;
        if (appName)
        {
            appVersion = selectedAppVersionName;
        }
        else
        {
            appName = dom.byId("txtAppName").value.trim();
            if (appName)
            {
                appVersion = "";
            }
            else
            {
                appName = editAppName;
                appVersion = editAppVersionName;
            }
        }

        var annoItem, callbackAnnoItem;

        for (var p in originalGrayBoxes)
        {
            shapesJson[p] = originalGrayBoxes[p];
        }

        if (isScreenshotAnonymized)
        {
            pluginParam[0] = outputImage();
        }

        if (isScreenshotAnonymized)
        {
            cordova.exec(
                function (result)
                {
                    var imageKey = result.imageAttrs.imageKey;
                    var screenshotDirPath = result.imageAttrs.screenshotPath;
                    var screenInfo = result.screenInfo;

                    annoItem = {
                        "anno_text":surface.getConcatenatedComment(),
                        "image":imageKey,
                        "draw_elements":dojoJson.stringify(shapesJson),
                        "screenshot_is_anonymized":isScreenshotAnonymized,
                        "anno_type":"draw comment",
                        "level":level,
                        "team_key":annoUtil.pluginTeamKey||"",
                        "screen_info":screenInfo
                    };

                    if (selectedType == "app") {
                        annoItem["app_name"] = appName;
                        annoItem["app_version"] = appVersion;
                    } else if (selectedType == "community") {
                        annoItem["community_name"] = appName;
                    }

                    AnnoDataHandler.updateAnno(editAnnoId, annoItem, screenshotDirPath, function(data) {
                        callbackAnnoItem = {
                            "comment" : annoItem["anno_text"],
                            "draw_elements" : annoItem["draw_elements"],
                            "image" : screenshotDirPath + "/" + annoItem["image"],
                            "appName" : data["app_name"],
                            "appVersion" : data["app_version"]
                        };

                        window.localStorage.setItem(annoUtil.localStorageKeys.editAnnoDone, "done");
                        window.localStorage.setItem(annoUtil.localStorageKeys.updatedAnnoData, dojoJson.stringify(callbackAnnoItem));
                    });
                },
                function (err)
                {
                    annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
                },
                "AnnoCordovaPlugin",
                'process_image_and_appinfo',
                pluginParam
            );
        }
        else
        {
            isScreenshotAnonymized =isScreenshotAnonymized||originalGrayBoxCnt>0;
            annoItem = {
                "anno_text":surface.getConcatenatedComment(),
                "draw_elements":dojoJson.stringify(shapesJson),
                "screenshot_is_anonymized":isScreenshotAnonymized,
                "anno_type":"draw comment",
                "level":level,
                "team_key":annoUtil.pluginTeamKey||""
            };

            if (selectedType == "app") {
                annoItem["app_name"] = appName;
                annoItem["app_version"] = appVersion;
            } else if (selectedType == "community") {
                annoItem["community_name"] = appName;
            }

            AnnoDataHandler.updateAnno(editAnnoId, annoItem, "", function(data) {
                callbackAnnoItem = {
                    "comment" : annoItem["anno_text"],
                    "draw_elements" : annoItem["draw_elements"],
                    "appName" : data["app_name"],
                    "appVersion" : data["app_version"]
                };

                window.localStorage.setItem(annoUtil.localStorageKeys.editAnnoDone, "done");
                window.localStorage.setItem(annoUtil.localStorageKeys.updatedAnnoData, dojoJson.stringify(callbackAnnoItem));
            });
        }
    };

    var outputImage = function()
    {
        var hiddenCanvas = dom.byId('hiddenCanvas');
        var ctx = hiddenCanvas.getContext('2d');
        ctx.fillStyle = "gray";

        var shapes = surface.registry;

        for (var p in shapes)
        {
            if (shapes[p].shapeType == "AnonymizedRectangle")
            {
                var shape = shapes[p].getShape();

                ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            }
        }

        var dataUrl = hiddenCanvas.toDataURL("image/png");
        var pos = dataUrl.lastIndexOf(",");
        dataUrl = dataUrl.substr(pos+1);

        return dataUrl;
    };

    /*var hideMenuDialog = function()
    {
        var menusDialog = registry.byId('menusDialog');
        menusDialog.hide();

        domClass.remove(menusDialog._cover[0], "transparentBack");
        domStyle.set(menusDialog._cover[0], {"height": "100%"});

        domClass.remove("barComment", 'barIconInactive');
        domClass.remove("barArrow", 'barIconInactive');
        domClass.remove("barBlackRectangle", 'barIconInactive');
        domClass.remove("barRectangle", 'barIconInactive');

        if (surface.allCommentFilled())
        {
            domClass.remove("barShare", 'barIconInactive');
        }

        domClass.remove("barMoreMenu", 'barMoreMenuActive');
    };*/

    /*var showMenuDialog = function()
    {
        var viewPoint = win.getBox();

        var menusDialog = registry.byId('menusDialog');
        menusDialog.show();
        domClass.add(menusDialog._cover[0], "transparentBack");
        domStyle.set(menusDialog._cover[0], {"height": (viewPoint.h-barHeight)+"px"});

        domClass.add("barComment", 'barIconInactive');
        domClass.add("barArrow", 'barIconInactive');
        domClass.add("barBlackRectangle", 'barIconInactive');
        domClass.add("barRectangle", 'barIconInactive');
        domClass.add("barShare", 'barIconInactive');

        domClass.add("barMoreMenu", 'barMoreMenuActive');

        surface.removeSelection();
    };*/

    var checkBarShareState = function()
    {
        if (surface.allCommentFilled())
        {
            domClass.remove("barShare", 'barIconInactive');
        }
        else
        {
            domClass.add("barShare", 'barIconInactive');
        }
    };

    var loadCommunities = function(callback)
    {
        OAuthUtil.getAccessToken(function(){
            annoUtil.loadUserCommunities(true, function(data){
                if (callback) callback(data.communityList);
            });
        });
    };

    var loadFavoriteApps = function(callback)
    {
        if (favoriteApps)
        {
            if (callback) callback(favoriteApps);
            return;
        }

        var APIConfig = {
            name: annoUtil.API.user,
            method: "user.favorite_apps.list",
            parameter: {email:annoUtil.getCurrentUserInfo().email},
            showLoadingSpinner: false,
            success: function(data)
            {
                favoriteApps = data.result.app_list||[];
                if (callback) callback(favoriteApps);
            },
            error: function(){
            }
        };

        annoUtil.callGAEAPI(APIConfig);
    };

    var setShareDialogUI = function()
    {
        if (annoUtil.isIOS())
        {
            // hide "My apps" tab, resize existing tabs
            domStyle.set(dom.byId("barRecentApps").parentNode, "display", "none");
            domStyle.set(dom.byId("btnCancel"), "display", "");

            dom.byId("barFavoriteApps").parentNode.setAttribute("width", "50%");
            dom.byId("barElseApps").parentNode.setAttribute("width", "50%");
        }
    };

    var onPluginAuthSuccess = function(data) {
        var userInfo = {};
        userInfo.userId = typeof data !== "undefined" ? data.result.id : "123456";
        userInfo.email = annoUtil.pluginUserEmail;
        userInfo.signinMethod = "plugin";
        userInfo.nickname = annoUtil.pluginUserDisplayName;
        userInfo.image_url = annoUtil.pluginUserImageURL;
        userInfo.team_key = annoUtil.pluginTeamKey;
        userInfo.team_secret = annoUtil.pluginTeamSecret;

        AnnoDataHandler.saveUserInfo(userInfo, function() {
            userInfo.signedup = 1;
            DBUtil.localUserInfo = userInfo;
            DBUtil.localUserInfo.signinmethod = userInfo.signinMethod;
            OAuthUtil.processBasicAuthToken(userInfo);
        });
    };

    var authenticatePluginSession = function() {
        var APIConfig = {
            name : annoUtil.API.account,
            method : "account.account.authenticate",
            parameter : {
                'user_email' : annoUtil.pluginUserEmail,
                'display_name' : annoUtil.pluginUserDisplayName,
                'user_image_url' : annoUtil.pluginUserImageURL,
                'team_key' : annoUtil.pluginTeamKey,
                'team_secret' : annoUtil.pluginTeamSecret
            },
            showLoadingSpinner: false,
            success : function(resp) {
                onPluginAuthSuccess(resp);
            },
            error : function() {
            }
        };

        annoUtil.setDefaultServer(annoUtil.pluginServer);
        annoUtil.callGAEAPI(APIConfig);
    };

    var authenticateForPlugin = function() {
        AnnoDataHandler.getCurrentUserInfo(function(userInfo) {
            annoUtil.getPluginUserInfo(function() {
                if (userInfo.email && (userInfo.email !== annoUtil.pluginUserEmail)) {
                    AnnoDataHandler.removeUser(function () {
                        OAuthUtil.clearRefreshToken();
                        onPluginAuthSuccess();
                    });
                } else {
                    onPluginAuthSuccess();
                }
            });
        });
    };

    var connectDomElements = function() {
        connect.connect(surface, "onShapeRemoved", function() {
            if (!surface.hasShapes()) {
                lastShapePos = {
                    x1 : Math.round((viewPoint.w - defaultShapeWidth) / 2),
                    y1 : 100 + defaultShapeHeight,
                    x2 : Math.round((viewPoint.w - defaultShapeWidth) / 2) + defaultShapeWidth,
                    y2 : 100
                };
                domClass.add("barShare", 'barIconInactive');
            } else {
                checkBarShareState();
            }
        });

        connect.connect(dom.byId("barMoreMenu"), "click", function(e) {
            annoUtil.showConfirmMessageDialog("Cancel Feedback?", function(ret) {
                if (ret) {
                    window.localStorage.setItem(annoUtil.localStorageKeys.editAnnoDone, "cancel");

                    cordova.exec(function(result) {
                    }, function(err) {
                        annoUtil.showErrorMessage({
                            type : annoUtil.ERROR_TYPES.CORDOVA_API_FAILED,
                            message : err.message
                        });
                    }, "AnnoCordovaPlugin", "exit_current_activity", []);
                }
            });
        });

        connect.connect(dom.byId("btnCancel"), "click", function() {
            var shareDialog = registry.byId('shareDialog');
            shareDialog.hide();
        });
    };

    var setupAnnoDrawPage = function() {
        initBackgroundImage();
        borderWidth = annoUtil.annotationWidth;

        window.setTimeout(function() {
            viewPoint = win.getBox();
            totalSpace = 0;

            lastShapePos = {
                x1 : Math.round((viewPoint.w - defaultShapeWidth) / 2),
                y1 : 100 + defaultShapeHeight,
                x2 : Math.round((viewPoint.w - defaultShapeWidth) / 2) + defaultShapeWidth,
                y2 : 100
            };

            lastBlackRectanglePos = {
                x1 : Math.round((viewPoint.w - defaultShapeWidth) / 2),
                y1 : 100 + defaultShapeHeight,
                x2 : Math.round((viewPoint.w - defaultShapeWidth) / 2) + defaultShapeWidth,
                y2 : 100
            };

            surface = window.surface = new Surface({
                container : dom.byId("gfxCanvasContainer"),
                width : viewPoint.w - borderWidth * 2,
                height : viewPoint.h - borderWidth * 2 - barHeight,
                borderWidth : borderWidth,
                drawMode : true
            });

            domStyle.set(surface.container, { 'borderWidth' : borderWidth + 'px' });

            // set screenshot container size
            domStyle.set('screenshotContainer', {
                width : (viewPoint.w - borderWidth * 2) + 'px',
                height : (viewPoint.h - borderWidth * 2 - barHeight) + 'px',
                borderWidth : borderWidth + "px"
            });

            // reposition the menus dialog
            /*var menusDialog = registry.byId('menusDialog');
            menusDialog.top = (viewPoint.h - barHeight - 44) + 'px';
            menusDialog.left = (viewPoint.w - 204) + 'px';
            domStyle.set(menusDialog.domNode, "backgroundColor", "white");*/
        }, 500);

        annoUtil.getTopTags(100);
    };

    var authenticateForStandalone = function() {
        if (DBUtil.userChecked) {
            var authResult = OAuthUtil.isAuthorized();
            if (annoUtil.hasConnection() && !authResult.authorized) {
                OAuthUtil.openAuthPage("annodraw");
                return;
            } else {
                AnnoDataHandler.getCurrentUserInfo(function(userInfo) {
                    if (authResult.newUser) {
                        annoUtil.startActivity("Intro", false);
                    }

                    if (userInfo.signinMethod == OAuthUtil.signinMethod.anno) {
                        OAuthUtil.processBasicAuthToken(userInfo);
                    }
                });

                setupAnnoDrawPage();

                // load all needed resources at startup
                loadCommunities();
                loadFavoriteApps();

                // show or hide tabs of picklist deponds on OS name
                setShareDialogUI();
            }
        } else {
            window.setTimeout(authenticateForStandalone, 20);
        }
    };

    var launchAnnoDrawPage = function() {
        if (annoUtil.isPlugin) {
            setupAnnoDrawPage();
            authenticateForPlugin();
        } else {
            authenticateForStandalone();
        }

        // disable JS and native gesture listener
        annoUtil.disableJSGesture();
        annoUtil.disableNativeGesture();

        // set the pick list dialog title
        dom.byId('sdTitle').children[0].innerHTML = annoUtil.getResourceString("title_app_pick_list");
        dom.byId('appOsName').innerHTML = annoUtil.isIOS() ? "iOS" : "Android";
        dom.byId('appOsName').setAttribute("data-app-version", device.version);
        dom.byId('appOsName').setAttribute("data-type", "app");
    };

    var setupAnnoDrawIcons = function() {
        dom.byId("barCommentImage").src = annoUtil.AnnoDrawCommentIcon;
        dom.byId("barArrowImage").src = annoUtil.AnnoDrawArrowIcon;
        dom.byId("barBlackRectangleImage").src = annoUtil.AnnoDrawBlackRectangleIcon;
        dom.byId("barRectangleImage").src = annoUtil.AnnoDrawRectangleIcon;
        dom.byId("barShareImage").src = annoUtil.AnnoDrawShareIcon;
        dom.byId("barMoreMenuImage").src = annoUtil.AnnoDrawCancelIcon;
    };

    var init = function() {
        annoUtil.setupGATracking();
        annoUtil.screenGATracking(annoUtil.analytics.category.annodraw);
        annoUtil.setPluginConfig();
        connectDomElements();
        setupAnnoDrawIcons();
        launchAnnoDrawPage();
    };

    document.addEventListener("backbutton", function(){

        // var menusDialog = registry.byId('menusDialog');
        var shareDialog = registry.byId('shareDialog');
        /*if (menusDialog.domNode.style.display === "")
        {
            hideMenuDialog();
        }
        else */if (shareDialog.domNode.style.display === "")
        {
            shareDialog.hide();
            // enable JS gesture listener, disable native gesture
            // annoUtil.enableJSGesture();
            // annoUtil.disableNativeGesture();
        }
        else
        {
            window.localStorage.setItem(annoUtil.localStorageKeys.editAnnoDone, "cancel");

            navigator.app.exitApp();
        }
    }, false);

    document.addEventListener("deviceready", function() {
        window.setTimeout(function() {
            annoUtil.checkIfPlugin();
            DBUtil.initDB(function() {
                console.log("[annodraw:main.js] DB is readay!");
                annoUtil.readSettings(function() { init(); });
            });
        }, 0);
    }, false);
});