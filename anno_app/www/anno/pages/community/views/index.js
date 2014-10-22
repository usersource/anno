define([
    "dojo/_base/array",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/query",
    "dojo/touch",
    "dojo/_base/lang",
    "dojo/_base/connect",
    "dojo/window",
    "dojo/has",
    "dojo/sniff",
    "dijit/registry",
    "dojox/mvc/at",
    "dojo/store/Memory",
    "dojox/mvc/getStateful",
    "anno/common/DBUtil",
    "anno/common/Util",
    "anno/common/OAuthUtil",
    "anno/anno/AnnoDataHandler"
],
    function (arrayUtil, dom, domClass, domGeom, domStyle, query, touch, lang, connect, win, has, sniff, registry, at, Memory, getStateful, DBUtil, annoUtil, OAuthUtil, AnnoDataHandler)
    {
        var _connectResults = []; // events connect results
        var eventsModel = null;
        var app = null;
        var listScrollTop = 0;
        var loadingData = false, firstListLoaded = false,
            offset = 0, limit=15, searchOffset = 0;
        var hasMoreData = false,
            hasMoreSearchData = false,
            inSearchMode = false,
            selectedAppName = "",
            searchDone = false;
        var SEARCH_ORDER = {
            RECENT: "recent",
            ACTIVE: "active",
            POPULAR: "popular"
        };
        var searchOrder = SEARCH_ORDER.RECENT, originalData = null, appNameList = null;
        var topBarHeight=48,
            bottomBarHeight = 50,
            appNameDialogGap = 80,
            searchAppNameContainerHeight = 26,
            searchSortsBarHeight = 26;
        var firstLaunch = true;
        var emptyAnno = {
            "id": 0,
            "annoText": "0",
            "app": "0",
            "appVersion":"",
            "author": "0",
            "screenshot":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=",
            circleX: 0,
            circleY:0,
            level:1,
            deviceInfo:" ",
            created: "",
            comments:[{
                author:'',
                comment:''
            }]
        };
        var timingLabels = {
            loading_list_done: 'loading_list_done'
        };

        var sdTitleHeight = 100,
            sdBottom = 90;
        var viewPoint, initialized = false;
        var startPull = false, pullStartY= 0, touchStartY = 0, doRefreshing = false;

        var loadListData = function (search, poffset, order, clearData)
        {
            loadingData = true;
            search = search == null ? false : search;
            clearData = clearData == null ? false : clearData;

            var arg = {
                outcome : 'cursor,has_more,anno_list',
                limit : limit,
                is_plugin : annoUtil.isPlugin
            };

            if (search)
            {
                arg.order_type = order || SEARCH_ORDER.RECENT;
                arg.search_string = dom.byId("txtSearchAnno").value;
                arg.only_my_apps = registry.byId("chkLimitToMyApps").checked ? true : false;

                if (selectedAppName)
                {
                    arg.app_name = selectedAppName;
                }
            }

            if (poffset)
            {
                if (search)
                {
                    arg.offset = poffset;
                }
                else
                {
                    arg.cursor = poffset;
                }
            }

            console.log("anno "+(search?"search":"list")+"ing, args:"+JSON.stringify(arg));

            if (search) {
                annoUtil.actionGATracking(annoUtil.analytics.category.search, 'submit search query', JSON.stringify(arg));
            }

            var APIConfig = {
                name: annoUtil.API.anno,
                method: search?"anno.anno.search":"anno.anno.list",
                parameter: arg,
                success: function(data)
                {
                    drawAnnoList(data, search, order, clearData);
                    if (firstLaunch) {
                        window.setTimeout(function() {
                            AnnoDataHandler.startBackgroundSync();
                            annoUtil.getTopTags(100);

                            if (!annoUtil.isPlugin) {
                                initPushService();
                                annoUtil.loadUserCommunities(true, function(data) {
                                    var inviteList = data.inviteList || [];
                                    for (var i = 0; i < inviteList.length; i++) {
                                        acceptInvitation(inviteList[i]);
                                    }
                                }, true);
                            }
                            firstLaunch = false;
                        }, 5 * 1000);
                    }
                },
                error: function()
                {
                    loadingData = false;
                    doRefreshing = false;
                    firstListLoaded = true;
                    registry.byId('progressBar').stopIndeterminateProgress();
                    hideStartRefreshMessage();

                    domStyle.set('noSearchResultContainer', 'display', 'none');
                }
            };

            if (doRefreshing)
            {
                APIConfig.showLoadingSpinner = false;
            }

            annoUtil.callGAEAPI(APIConfig);
        };

        var drawAnnoList = function(data, search, order, clearData)
        {
            registry.byId('progressBar').stopIndeterminateProgress();
            hideStartRefreshMessage();

            var annoList = data.result.anno_list||[];

            var spliceArgs = clearData?[0, eventsModel.model.length]:[eventsModel.model.length, 0];
            for (var i = 0, l = annoList.length; i < l; i++)
            {
                var eventData = lang.clone(emptyAnno);

                eventData.annoText = annoList[i].anno_text;
                eventData.annoType = annoList[i].anno_type;
                eventData.annoIcon = annoList[i].anno_type == annoUtil.annoType.SimpleComment?"icon-simplecomment":"icon-shapes";
                eventData.app = annoList[i].app_name;
                eventData.appVersion = annoList[i].app_version;
                eventData.author = annoList[i].creator?annoList[i].creator.display_name||annoList[i].creator.user_email||annoList[i].creator.user_id:"";
                eventData.id = annoList[i].id;
                // eventData.circleX = parseInt(annoList[i].simple_x, 10);
                // eventData.circleY = parseInt(annoList[i].simple_y, 10);
                // eventData.simple_circle_on_top = annoList[i].simple_circle_on_top;
                eventData.simple_circle_on_top = false;
                eventData.level = parseInt(annoList[i].level);
                eventData.deviceInfo = annoList[i].device_model;
                eventData.created = annoUtil.getTimeAgoString(annoList[i].created);
                eventData.app_icon_url = annoList[i].app_icon_url||"";

                eventData.readStatusClass = "";
                if ('anno_read_status' in annoList[i]) {
                    eventData.read_status = annoList[i].anno_read_status || false;
                    eventData.readStatusClass = (eventData.read_status == true) ? "read" : "unread";
                }

                if (eventData.app_icon_url)
                {
                    eventData.annoIcon = "hidden";
                    eventData.appIconClass = "";
                }
                else
                {
                    eventData.appIconClass = "hidden";
                }

                spliceArgs.push(new getStateful(eventData));
            }

            if (clearData&&originalData == null)
            {
                originalData = eventsModel.model.splice.apply(eventsModel.model, spliceArgs);
            }
            else
            {
                eventsModel.model.splice.apply(eventsModel.model, spliceArgs);
            }

            if (!firstListLoaded) {
                annoUtil.timeit(timingLabels.loading_list_done);
                var t = annoUtil.time_since()
                annoUtil.timingGATracking('Feed list loaded', 'Since page load', t);
            }

            annoUtil.hideLoadingIndicator();
            loadingData = false;
            doRefreshing = false;
            firstListLoaded = true;

            if (search)
            {
                searchDone = true;
                searchOffset = data.result.offset;
                hasMoreSearchData = data.result.has_more;

                if (order)
                {
                    domClass.remove(dom.byId("searchSortsBarRecent").parentNode);
                    domClass.remove(dom.byId("searchSortsBarActive").parentNode);
                    domClass.remove(dom.byId("searchSortsBarPopular").parentNode);

                    if (order == SEARCH_ORDER.RECENT)
                    {
                        domClass.add(dom.byId("searchSortsBarRecent").parentNode, "searchSortItemActive");
                    }
                    else if (order == SEARCH_ORDER.ACTIVE)
                    {
                        domClass.add(dom.byId("searchSortsBarActive").parentNode, "searchSortItemActive");
                    }
                    else if (order == SEARCH_ORDER.POPULAR)
                    {
                        domClass.add(dom.byId("searchSortsBarPopular").parentNode, "searchSortItemActive");
                    }
                }

                if (clearData&&annoList.length <=0)
                {
                    domStyle.set('noSearchResultContainer', 'display', '');
                }
                else
                {
                    domStyle.set('noSearchResultContainer', 'display', 'none');
                }

            }
            else
            {
                offset = data.result.cursor;
                hasMoreData = data.result.has_more;
            }
        };

        var loadMoreData = function()
        {
            if (loadingData) return;
            if (!hasMoreData&&!(inSearchMode&&searchDone)) return;
            if (!hasMoreSearchData&&(inSearchMode&&searchDone)) return;

            if (inSearchMode&&searchDone)
            {
                loadListData(true, searchOffset, searchOrder);
            }
            else
            {
                loadListData(false, offset);
            }

            //adjustSize();
        };

        var adjustSize = function()
        {
            viewPoint = win.getBox();

            domStyle.set("listContainerStart", "height", (viewPoint.h-topBarHeight)+"px");

            // reposition the menus dialog
            var menusDialog = registry.byId('menusDialog');
            menusDialog.top = topBarHeight+'px';
            menusDialog.left = (viewPoint.w-204)+'px';

            // set share dialog size
            domStyle.set('appNameDialog', {
                width: (viewPoint.w-appNameDialogGap)+'px',
                height: (viewPoint.h-appNameDialogGap)+'px'
            });

            domStyle.set('sdTitle', 'height', sdTitleHeight+'px');
            domStyle.set('sdAppList', 'height', (viewPoint.h-sdTitleHeight-sdBottom-appNameDialogGap)+'px');
            domStyle.set('sdBottom', 'height', sdBottom+'px');

            registry.byId('progressBar').set('width', viewPoint.w);
//            domStyle.set('pullToRefreshMsg', 'left', (viewPoint.w-180)/2+'px');
        };

        var goBackActivity = function()
        {
            cordova.exec(
                function (data)
                {

                },
                function (err)
                {
                    annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.CORDOVA_API_FAILED, message: err.message});
                },
                "AnnoCordovaPlugin",
                'exit_current_activity',
                []
            );
        };

        var exitApp = function()
        {
            var menusDialog = registry.byId('menusDialog'), appNameDialog = registry.byId('appNameDialog');

            if (menusDialog.domNode.style.display == "")
            {
                hideMenuDialog();
            }
            else if (appNameDialog.domNode.style.display == "")
            {
                hideAppNameDialog();
            }
            else if (inSearchMode)
            {
                cancelSearch();
            }
            else
            {
                navigator.app.exitApp();
            }
        };

        var cancelSearch = function()
        {
            if (originalData)
            {
                originalData.splice(0,0, 0, originalData.length);
                eventsModel.model.splice.apply(eventsModel.model, [0,eventsModel.model.length]);
                eventsModel.model.splice.apply(eventsModel.model, originalData);
                originalData = null;
            }

            domStyle.set('navBtnBackHome', 'display', 'none');
            domStyle.set('navLogoTextHome', 'display', '');
            domStyle.set('tdBarMyStuff', 'display', '');
            domStyle.set('tdBarAddImage', 'display', '');
            domStyle.set('tdBarSearchAnno', 'display', '');
            domStyle.set('tdBarSettings', 'display', '');
            domStyle.set('tdBarMoreMenuHome', 'display', 'none');
            domStyle.set('txtSearchAnno', 'display', 'none');
            dom.byId("txtSearchAnno").value = "";
            domStyle.set('tdHeadingLeft', 'width', '180px');
            domStyle.set('annoLogoHome', 'paddingLeft', '10px');
            domStyle.set('searchSortsBarHome', 'display', 'none');

            domStyle.set("listContainerStart", "height", (viewPoint.h-topBarHeight)+"px");
            domStyle.set('noSearchResultContainer', 'display', 'none');
            domStyle.set('searchAppNameContainer', 'display', 'none');
            dom.byId('searchAppName').innerHTML = "";

            domClass.remove(dom.byId("searchSortsBarRecent").parentNode);
            domClass.remove(dom.byId("searchSortsBarActive").parentNode);
            domClass.remove(dom.byId("searchSortsBarPopular").parentNode);
            domClass.add(dom.byId("searchSortsBarRecent").parentNode, "searchSortItemActive");

            searchOrder = SEARCH_ORDER.RECENT;

            selectedAppName = "";

            inSearchMode = false;
            searchDone = false;
            annoUtil.actionGATracking(annoUtil.analytics.category.search, 'cancel search', 'homescreen');
        };

        var hideMenuDialog = function()
        {
            var menusDialog = registry.byId('menusDialog');

            if (!menusDialog) return;
            menusDialog.hide();

            if (menusDialog._cover[0])
            {
                domClass.remove(menusDialog._cover[0], "transparentBack");
                domStyle.set(menusDialog._cover[0], {"height": "100%", top:"0px"});
            }

            domClass.remove("barMoreMenuHome", 'barMoreMenuActive');
        };

        var showMenuDialog = function()
        {
            var viewPoint = win.getBox();

            var menusDialog = registry.byId('menusDialog');
            menusDialog.show();
            domClass.add(menusDialog._cover[0], "transparentBack");
            domStyle.set(menusDialog._cover[0], {"height": (viewPoint.h-topBarHeight)+"px", top:topBarHeight+"px"});

            domClass.add("barMoreMenuHome", 'barMoreMenuActive');
        };

        var showAppNameDialog = function()
        {
            var appNameDialog = registry.byId('appNameDialog');
            appNameDialog.show();

            dom.byId('btnAppNameDialogDone').disabled = true;
            domClass.add('btnAppNameDialogDone', "disabledBtn");
            dom.byId('txtSearchAppName').value = "";
            selectedAppName = "";

            if (appNameList == null)
            {
                cordova.exec(
                    function (result)
                    {
                        if (result&&result.length>0)
                        {
                            appNameList = result;
                            fillAppNameList(result);
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
            }
            else
            {
                fillAppNameList(appNameList);
            }
        };

        var fillAppNameList = function(appList)
        {
            var content = "", appItem = null;
            for (var i= 0,c=appList.length;i<c;i++)
            {
                appItem = appList[i];
                if (i == 0)
                {
                    content = content + '<div class="appNameItem firstAppNameItem"><div class="appNameValue">'+appItem.name+'</div></div>'
                }
                else
                {
                    content = content + '<div class="appNameItem"><div class="appNameValue">'+appItem.name+'</div></div>'
                }
            }

            dom.byId('sdAppListContent').innerHTML = content;
        };

        var hideAppNameDialog = function()
        {
            var appNameDialog = registry.byId('appNameDialog');

            if (!appNameDialog) return;
            appNameDialog.hide();
        };

        var doFilterAppName = function()
        {
            var appName = dom.byId("txtSearchAppName").value.trim(), matchedAppNameList = [];
            selectedAppName = "";

            if (appName.length > 0)
            {
                for (var i= 0,c=appNameList.length;i<c;i++)
                {
                    if (appNameList[i].name.indexOf(appName) >=0)
                    {
                        matchedAppNameList.push(appNameList[i]);
                    }
                }

                fillAppNameList(matchedAppNameList);
            }
            else
            {
                fillAppNameList(appNameList);
            }

            if (appName.length <=0)
            {
                dom.byId('btnAppNameDialogDone').disabled = true;
                domClass.add('btnAppNameDialogDone', "disabledBtn");
            }
        };

        var onChkLimitToMyApps = window.onChkLimitToMyApps = function()
        {
            if (registry.byId("chkLimitToMyApps").checked)
            {
                fillAppNameList(appNameList);
                dom.byId('btnAppNameDialogDone').disabled = false;
                domClass.remove('btnAppNameDialogDone', "disabledBtn");
            }
            else
            {
                fillAppNameList(appNameList);
                dom.byId('btnAppNameDialogDone').disabled = true;
                domClass.add('btnAppNameDialogDone', "disabledBtn");
            }
        };

        var annoRead = window.annoRead = function() {
            if (domClass.contains(this.domNode, "unread")) {
                domClass.replace(this.domNode, "read", "unread");
            }
        };

        // pull to refresh

        var showPullToRefreshMessage = function()
        {
            domStyle.set('headingStartTable', 'display', 'none');
            dom.byId('pullToRefreshMsg').innerHTML = "Pull down to refresh";
            domStyle.set('pullToRefreshMsg', 'display', '');
        };

        var showStartRefreshMessage = function()
        {
            domStyle.set('headingStartTable', 'display', 'none');
            dom.byId('pullToRefreshMsg').innerHTML = "Refreshing UserSource feed";
            domStyle.set('pullToRefreshMsg', 'display', '');
        };

        var hidePullToRefreshMessage = function()
        {
            domStyle.set('headingStartTable', 'display', '');
            domStyle.set('pullToRefreshMsg', 'display', 'none');
        };

        var hideStartRefreshMessage = function()
        {
            domStyle.set('headingStartTable', 'display', '');
            domStyle.set('pullToRefreshMsg', 'display', 'none');
        };

        var doRefresh = function()
        {
            doRefreshing = true;
            loadListData(null, null, null, true);

            // hide start refresh message 1 seconds later.
            window.setTimeout(hideStartRefreshMessage, 1000);
        };

        var acceptInvitation = function(inviteData)
        {
            var APIConfig = {
                name: annoUtil.API.user,
                method: "user.invite.accept",
                parameter: {invite_hash:inviteData.invite_hash, user_email:annoUtil.getCurrentUserInfo().email},
                showLoadingSpinner: false,
                keepLoadingSpinnerShown: true,
                success: function(data){
                    console.log("invitation accepted.");
                },
                error: function(){
                }
            };

            annoUtil.callGAEAPI(APIConfig);
        };

        // push notifications related
        var initPushService = function()
        {
            var pushNotification = window.pushNotification = window.plugins.pushNotification;

            if (annoUtil.isIOS())
            {
                pushNotification.register(
                    function(result)
                    {
                        // token handler
                        console.log("Got iOS device token: " + result);
                        setDeviceId(result);
                    },
                    function (error)
                    {
                        annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.CORDOVA_API_FAILED, message: "An error occurred when calling pushNotification.register: "+error});
                    },
                    {
                        "badge":"true",
                        "sound":"true",
                        "alert":"true",
                        "ecb":"onNotificationAPN"
                    });
            }
            else
            {
                pushNotification.register(
                    function (result)
                    {
                        console.log('pushNotification.register Callback Success! Result = ' + result);
                    },
                    function (error)
                    {
                        annoUtil.showErrorMessage({type: annoUtil.ERROR_TYPES.CORDOVA_API_FAILED, message: "An error occurred when calling pushNotification.register: "+error});
                    },
                    {
                        "senderID": annoUtil.API.config[annoUtil.getSettings().ServerURL].gcm_sender_id,
                        "ecb": "onNotification"
                    });
            }
        };

        // push notification callback for android
        var onNotification = window.onNotification = function(e) {
            switch( e.event )
            {
                case 'registered':
                    if ( e.regid.length > 0 )
                    {
                        // Your GCM push server needs to know the regID before it can push to this device
                        // here is where you might want to send it the regID for later use.
                        console.log("GCM regID = " + e.regid);
                        setDeviceId(e.regid);
                    }
                    break;

                case 'message':
                    // if this flag is set, this notification happened while we were in the foreground.
                    // you might want to play a sound to get the user's attention, throw up a dialog, etc.
                    if ( e.foreground )
                    {
                        // on Android soundname is outside the payload.
                        // On Amazon FireOS all custom attributes are contained within payload
                        // if app is in foreground, show a message box with the notification message and OK Cancel buttons
                        // message format: Notification: notificaton message, would you like to check it now?
                        // if user tapped OK button then goes to activity page.
                        annoUtil.showConfirmMessageDialog("Notification: <br/>"+ e.payload.message +"<br/><br/>would you like to check it now?", function(ret){
                            if (ret)
                            {
                                annoUtil.actionGATracking(annoUtil.analytics.category.feed, "selected view from push notification");
                                goActivitiesScreen();
                            }
                        });
                    }
                    else
                    {
                        // otherwise we were launched because the user touched a notification in the notification tray.
                        annoUtil.actionGATracking(annoUtil.analytics.category.feed, "launch by push notification");
                        goActivitiesScreen();
                    }

                    break;

                case 'error':
                    console.log("Notification error: " + e.msg);
                    break;

                default:
                    break;
            }
        };

        // push notification callback for iOS
        var onNotificationAPN = window.onNotificationAPN = function(e) {
            console.log(e);
            console.log("onNotification: " + JSON.stringify(e));

            if (Number(e.foreground)) {
                var message  = generateIOSMessage(e);
                annoUtil.showConfirmMessageDialog("Notification: <br/>"+ message +"<br/><br/>would you like to check it now?",
                    function(ret) {
                        if (ret) {
                            annoUtil.actionGATracking(annoUtil.analytics.category.feed, "selected view from push notification");
                            goActivitiesScreen();
                        }
                    });
            } else {
                annoUtil.actionGATracking(annoUtil.analytics.category.feed, "launch by push notification");
                goActivitiesScreen();
            }
        };

        var generateIOSMessage = function(msg) {
            var messageTemplate = {
                "ANNO_COMMENTED" : "{1} commented on an anno for {2}: '{3}'",
                "ANNO_CREATED" : "{1} created an anno for {2}: '{3}'",
                "ANNO_EDITED" : "{1} edited the anno for {2}: '{3}'",
                "ANNO_DELETED" : "{1} deleted the anno for {2}: '{3}'"
            };

            var message = messageTemplate[msg.aps.alert["loc-key"]];
            message = message.replace("{1}", msg.aps.alert["loc-args"][0]);
            message = message.replace("{2}", msg.aps.alert["loc-args"][1]);
            message = message.replace("{3}", msg.aps.alert["loc-args"][2]);

            return message;
        };

        /**
         * check if local saved device id is same to given device id,
         * if not, call user.user.deviceid.update API to update it.
         * @param deviceId
         */
        var setDeviceId = function(deviceId)
        {
            var savedDeviceId = window.localStorage.getItem(annoUtil.localStorageKeys.deviceId);

            if (deviceId === savedDeviceId) return;

            updateDeviceId(deviceId);
        };

        var updateDeviceId = function(deviceId)
        {
            var APIConfig = {
                name: annoUtil.API.user,
                method: "user.user.deviceid.update",
                parameter: {
                    device_id:deviceId,
                    device_type:annoUtil.isIOS()?"iOS":"Android"
                },
                showLoadingSpinner: false,
                keepLoadingSpinnerShown: true,
                success: function(data){
                    window.localStorage.setItem(annoUtil.localStorageKeys.deviceId, deviceId);
                    console.log("device id updated.");
                },
                error: function(){
                }
            };

            annoUtil.callGAEAPI(APIConfig);
        };

        var goActivitiesScreen = function()
        {
            // check if we are in Activities screen already, if yes, just do refresh
            var activitiesViewNode = dom.byId('modelApp_myStuff');
            if (activitiesViewNode&&activitiesViewNode.style.display != 'none')
            {
                app.refreshMyActivites();
            }
            else
            {
                annoUtil.actionGATracking(annoUtil.analytics.category.feed, "nav to activity", "homescreen");
                app.transitionToView(document.getElementById('modelApp_home'), {target:'myStuff',url:'#myStuff'});
            }
        };

        var checkInternetConnection = function(callback) {
            if (!annoUtil.hasConnection()) {
                annoUtil.showLoadingIndicator();
                dom.byId("errorMessage").innerHTML = "We couldn't detect a network connection.";
                dom.byId("btnErrorAction").innerHTML = "Retry";

                var handle = connect.connect(dom.byId("btnErrorAction"), 'click', function(e) {
                    dojo.stopEvent(e);
                    connect.disconnect(handle);
                    delete gapi;
                    delete ___jsl;
                    load_gapi_client();
                    domStyle.set('errorWindow', 'display', 'none');
                    checkInternetConnection(callback);
                });

                setTimeout(function() {
                    annoUtil.hideLoadingIndicator();
                    domStyle.set('errorWindow', 'display', '');
                }, 2000);
            } else {
                callback();
            }
        };

        var connectDomElements = function() {
            _connectResults.push(connect.connect(dom.byId("tdBarMyStuff"), 'click', function(e) {
                dojo.stopEvent(e);
                hideMenuDialog();
    
                annoUtil.actionGATracking(annoUtil.analytics.category.feed, "nav to activity", "homescreen");
                app.transitionToView(document.getElementById('modelApp_home'), {
                    target : 'myStuff',
                    url : '#myStuff'
                });
            }));

            _connectResults.push(connect.connect(dom.byId("tdBarAddImage"), 'click', function(e) {
                var options = {
                    destinationType : Camera.DestinationType.FILE_URI,
                    sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
                    mediaType : Camera.MediaType.PICTURE
                };

                if (annoUtil.isAndroid()) {
                    options.sourceType = Camera.PictureSourceType.SAVEDPHOTOALBUM;
                    options.destinationType = Camera.DestinationType.NATIVE_URI;
                }

                navigator.camera.getPicture(onSuccess, OnFail, options);
                annoUtil.actionGATracking(annoUtil.analytics.category.feed, 'header button to create', 'homescreen');

                function onSuccess(imageURI) {
                    console.log("imageURI: " + imageURI);
                    // only support local image uri, TODO: show a message box?
                    if (imageURI.indexOf("https%3A%2F%2F") > 0 || imageURI.indexOf("http%3A%2F%2F") > 0) {
                        cordova.exec(function(result) {
                        }, function(err) {
                        }, "AnnoCordovaPlugin", 'show_toast', ["UserSource support local images files only."]);
    
                        return;
                    }

                    if (annoUtil.isAndroid()) {
                        cordova.exec(function(result) {
                        }, function(err) {
                        }, "AnnoCordovaPlugin", 'start_anno_draw', [imageURI]);
                    } else {
                        // iOS: Setting timeout as AnnoDrawViewController doesn't come up
                        // when photo library is dismissing.
                        setTimeout(function() {
                            cordova.exec(function(result) {
                            }, function(err) {
                            }, "AnnoCordovaPlugin", 'start_anno_draw', [imageURI]);
                        }, 1000);
                    }
                }

                function OnFail() {
                }
            }));

            _connectResults.push(connect.connect(dom.byId("tdBarSearchAnno"), 'click', function(e) {
                hideMenuDialog();

                domStyle.set("listContainerStart", "height", (viewPoint.h - topBarHeight - searchSortsBarHeight) + "px");

                domStyle.set('navBtnBackHome', 'display', '');
                domStyle.set('navLogoTextHome', 'display', 'none');
                domStyle.set('tdBarMyStuff', 'display', 'none');
                domStyle.set('tdBarAddImage', 'display', 'none');
                domStyle.set('tdBarSearchAnno', 'display', 'none');
                domStyle.set('tdBarSettings', 'display', 'none');
                domStyle.set('tdBarMoreMenuHome', 'display', '');
                domStyle.set('txtSearchAnno', 'display', '');
                domStyle.set('tdHeadingLeft', 'width', '95px');
                domStyle.set('annoLogoHome', 'paddingLeft', '0px');
                domStyle.set('searchSortsBarHome', 'display', '');

                dom.byId('txtSearchAnno').focus();
                inSearchMode = true;
                dojo.stopEvent(e);

                annoUtil.actionGATracking(annoUtil.analytics.category.feed, 'header button to search', 'homescreen');
            }));
    
            _connectResults.push(connect.connect(dom.byId("tdBarSettings"), 'click', function(e) {
                app.transitionToView(document.getElementById('modelApp_home'), {
                    target : 'settings',
                    url : '#settings'
                });
                annoUtil.actionGATracking(annoUtil.analytics.category.feed, 'header button to settings', 'homescreen');
            }));
    
            _connectResults.push(connect.connect(dom.byId("barMoreMenuHome"), 'click', function(e) {
                if (inSearchMode) {
                    window.setTimeout(function() { showAppNameDialog(); }, 500);
                } else {
                    var menusDialog = registry.byId('menusDialog');
                    if (menusDialog.domNode.style.display === "") {
                        hideMenuDialog();
                    } else {
                        showMenuDialog();
                    }
                }
            }));
    
            _connectResults.push(connect.connect(dom.byId("tdLogo"), 'click', function(e) {
                cancelSearch();
            }));
    
            _connectResults.push(connect.connect(dom.byId('btnLoadListData'), "click", function() {
                loadListData();
            }));
    
            _connectResults.push(connect.connect(dom.byId('navBtnBackStart'), "click", function() {
                goBackActivity();
            }));
    
            _connectResults.push(connect.connect(dom.byId('searchSortsBarRecent'), "click", function() {
                if (domClass.contains(dom.byId('searchSortsBarRecent').parentNode, 'searchSortItemActive')) {
                    return;
                }
    
                searchOrder = SEARCH_ORDER.RECENT;
                loadListData(true, null, SEARCH_ORDER.RECENT, true);
    
                annoUtil.actionGATracking(annoUtil.analytics.category.search, 'select recent', 'homescreen');
            }));
    
            _connectResults.push(connect.connect(dom.byId('searchSortsBarActive'), "click", function() {
                if (domClass.contains(dom.byId('searchSortsBarActive').parentNode, 'searchSortItemActive')) {
                    return;
                }
    
                searchOrder = SEARCH_ORDER.ACTIVE;
                loadListData(true, null, SEARCH_ORDER.ACTIVE, true);
    
                annoUtil.actionGATracking(annoUtil.analytics.category.search, 'select active', 'homescreen');
            }));
    
            _connectResults.push(connect.connect(dom.byId('searchSortsBarPopular'), "click", function() {
                if (domClass.contains(dom.byId('searchSortsBarPopular').parentNode, 'searchSortItemActive')) {
                    return;
                }
    
                searchOrder = SEARCH_ORDER.POPULAR;
                loadListData(true, null, SEARCH_ORDER.POPULAR, true);
    
                annoUtil.actionGATracking(annoUtil.analytics.category.search, 'select popular', 'homescreen');
            }));
    
            _connectResults.push(connect.connect(dom.byId('txtSearchAnno'), "keydown", function(e) {
                if (e.keyCode == 13) {
                    dom.byId("hiddenBtn").focus();
                    loadListData(true, null, searchOrder, true);
                }
            }));
    
            _connectResults.push(connect.connect(dom.byId('btnAppNameDialogCancel'), "click", function() {
                hideAppNameDialog();
            }));
    
            _connectResults.push(connect.connect(dom.byId('txtSearchAppName'), "keydown", function(e) {
                if (e.keyCode == 13) {
                    dom.byId("hiddenBtn").focus();
                    doFilterAppName();
                }
            }));
    
            _connectResults.push(connect.connect(dom.byId('txtSearchAppName'), "input", function(e) {
                if (dom.byId('txtSearchAppName').value.trim().length > 0) {
                    dom.byId('btnAppNameDialogDone').disabled = false;
                    domClass.remove('btnAppNameDialogDone', "disabledBtn");
                } else {
                    dom.byId('btnAppNameDialogDone').disabled = true;
                    domClass.add('btnAppNameDialogDone', "disabledBtn");
                }
            }));
    
            _connectResults.push(connect.connect(dom.byId('icoSearchAppName'), "click", function() {
                dom.byId("hiddenBtn").focus();
                doFilterAppName();
            }));
    
            // handle app name list click event
            _connectResults.push(connect.connect(dom.byId("sdAppListContent"), 'click', function(e) {
                var itemNode = e.target;
    
                if (domClass.contains(itemNode, 'appNameValue')) {
                    itemNode = itemNode.parentNode;
                }
    
                if (!domClass.contains(itemNode, 'appNameItem')) {
                    return;
                }
    
                var allItems = query('.appNameItem', dom.byId("sdAppList"));
    
                for (var i = 0; i < allItems.length; i++) {
                    domClass.remove(allItems[i], 'appNameItem-active');
                }
    
                domClass.add(itemNode, 'appNameItem-active');
    
                selectedAppName = itemNode.children[0].innerHTML;
                dom.byId('btnAppNameDialogDone').disabled = false;
                domClass.remove('btnAppNameDialogDone', "disabledBtn");
            }));
    
            _connectResults.push(connect.connect(dom.byId('btnAppNameDialogDone'), "click", function() {
                if (domClass.contains('btnAppNameDialogDone', 'disabledBtn')) {
                    return;
                }
    
                var appName = selectedAppName;
    
                if (!appName) {
                    if (dom.byId('txtSearchAppName').value.trim().length > 0) {
                        appName = dom.byId('txtSearchAppName').value.trim();
                        selectedAppName = appName;
                    } else if (!registry.byId("chkLimitToMyApps").checked) {
                        annoUtil.showMessageDialog("Please select app in apps list or enter app in search text box.");
                        return;
                    }
                }
    
                hideAppNameDialog();
    
                if (appName) {
                    domStyle.set('searchAppNameContainer', 'display', '');
                    dom.byId('searchAppName').innerHTML = appName;
                } else {
                    domStyle.set('searchAppNameContainer', 'display', 'none');
                    dom.byId('searchAppName').innerHTML = "";
                }
    
                domStyle.set("listContainerStart", "height", (viewPoint.h - topBarHeight - searchSortsBarHeight - searchAppNameContainerHeight) + "px");
                loadListData(true, null, searchOrder, true);
            }));
    
            _connectResults.push(connect.connect(dom.byId('closeSearchAppName'), "click", function() {
                domStyle.set('searchAppNameContainer', 'display', 'none');
                dom.byId('searchAppName').innerHTML = "";
                selectedAppName = "";
    
                domStyle.set("listContainerStart", "height", (viewPoint.h - topBarHeight - searchSortsBarHeight) + "px");
                loadListData(true, null, searchOrder, true);
            }));
    
            _connectResults.push(connect.connect(dom.byId('listContainerStart'), "scroll", this, function() {
                var toEnd = false;
                var listContainer = dom.byId('listContainerStart');
                if ((listContainer.clientHeight + listContainer.scrollTop) >= listContainer.scrollHeight)
                    toEnd = true;
    
                if (toEnd) {
                    annoUtil.actionGATracking(annoUtil.analytics.category.feed, 'scroll', 'homescreen');
                    loadMoreData();
                }
            }));
    
            // pull to refresh
            _connectResults.push(connect.connect(dom.byId('listContainerStart'), "touchmove", this, function(e) {
                if (!loadingData && firstListLoaded && !inSearchMode) {
                    var listContainer = dom.byId('listContainerStart');
    
                    if (startPull) {
                        e.preventDefault();
                        var delta = e.touches[0].pageY - pullStartY;
                        registry.byId('progressBar').showSmoothProgress(delta);
                    } else {
                        if (listContainer.scrollTop <= 0 && (e.touches[0].pageY - touchStartY) > 0) {
                            e.preventDefault();
                            startPull = true;
                            pullStartY = e.touches[0].pageY;
                            showPullToRefreshMessage();
                        }
                    }
                }
            }));
    
            _connectResults.push(connect.connect(dom.byId('listContainerStart'), "touchstart", this, function(e) {
                startPull = false;
                pullStartY = 0;
                touchStartY = e.touches[0].pageY;
            }));
    
            _connectResults.push(connect.connect(registry.byId('progressBar'), "onSmoothProgressComplete", this, function() {
                // now we can start refreshing anno feeds
                hidePullToRefreshMessage();
                showStartRefreshMessage();
                registry.byId('progressBar').showIndeterminateProgress();
                doRefresh();
            }));
    
            _connectResults.push(connect.connect(dom.byId('listContainerStart'), "touchend", this, function(e) {
                if (!loadingData) {
                    var progressBar = registry.byId('progressBar');
    
                    if (startPull && !progressBar.showingIndeterminateProgress) {
                        registry.byId('progressBar').showSmoothProgress(0);
                        hidePullToRefreshMessage();
                    }
    
                    startPull = false;
                    pullStartY = 0;
                    touchStartY = 0;
                }
            }));
    
            _connectResults.push(connect.connect(dom.byId('listContainerStart'), "touchcancel", this, function(e) {
                if (!loadingData) {
                    var progressBar = registry.byId('progressBar');
    
                    if (startPull && !progressBar.showingIndeterminateProgress) {
                        registry.byId('progressBar').showSmoothProgress(0);
                        hidePullToRefreshMessage();
                    }
    
                    startPull = false;
                    pullStartY = 0;
                    touchStartY = 0;
                }
            }));
    
            // pull to refresh end
        }; 

        var authenticatePluginSession = function() {
            var APIConfig = {
                name : annoUtil.API.account,
                method : "account.account.authenticate",
                parameter : {
                    'user_email' : annoUtil.pluginUserEmail,
                    'team_key' : annoUtil.pluginTeamKey,
                    'team_secret' : annoUtil.pluginTeamSecret
                },
                success : function(resp) {
                    var userInfo = {};
                    userInfo.userId = resp.result.id;
                    userInfo.email = annoUtil.pluginUserEmail;
                    userInfo.signinMethod = "plugin";
                    userInfo.nickname = resp.result.display_name;
                    userInfo.team_key = annoUtil.pluginTeamKey;
                    userInfo.team_secret = annoUtil.pluginTeamSecret;

                    AnnoDataHandler.saveUserInfo(userInfo, function() {
                        var params = annoUtil.parseUrlParams(document.location.search),
                            _callbackURL = params['callback'],
                            joinString = "?",
                            cbURL = "",
                            tokenString = "token=9&newuser=0&signinmethod=anno";

                        if (_callbackURL.indexOf("?") > 0 || _callbackURL.indexOf("#") > 0) {
                            joinString = "&";
                        }

                        cbURL = _callbackURL + joinString + tokenString;
                        window.open(cbURL, "_self");
                    });
                },
                error : function() {
                }
            };

            annoUtil.setDefaultServer("4");
            annoUtil.showLoadingIndicator();
            annoUtil.callGAEAPI(APIConfig);
        };

        var launchCommunityPage = function() {
            if (DBUtil.userChecked) {
                var authResult = OAuthUtil.isAuthorized();
                if (!authResult.authorized) {
                    if (annoUtil.isPlugin) {
                        annoUtil.getPluginUserInfo(function() {
                            authenticatePluginSession();
                        });
                    } else {
                        OAuthUtil.openAuthPage();
                    }
                    return;
                } else {
                    AnnoDataHandler.getCurrentUserInfo(function(userInfo) {
                        if (authResult.newUser) {
                            annoUtil.startActivity("Intro", false);
                        }

                        if (userInfo.signinMethod == OAuthUtil.signinMethod.anno ||
                            userInfo.signinMethod == OAuthUtil.signinMethod.plugin) {
                            OAuthUtil.processBasicAuthToken(userInfo);
                        }

                        annoUtil.showLoadingIndicator();
                        OAuthUtil.getAccessToken(function() { loadListData(); });
                    });

                    adjustSize();

                    initialized = true;
                    annoUtil.setVersionInfo();
                }
            } else {
                window.setTimeout(launchCommunityPage, 20);
            }
        }; 

        var _init = function() {
            annoUtil.setupGATracking();
            connectDomElements();
            launchCommunityPage();
        };

        return {
            // simple view init
            init:function ()
            {
                eventsModel = this.loadedModels.events;
                app = this.app;
                app.inSearchMode = function() { return inSearchMode; };
                checkInternetConnection(_init);
            },
            afterActivate: function()
            {
                // Analytics
                annoUtil.screenGATracking(annoUtil.analytics.category.feed);
                        
                adjustSize();
                var listContainer = dom.byId('listContainerStart');
                listContainer.scrollTop = listScrollTop;

                document.removeEventListener("backbutton", exitApp, false);
                document.addEventListener("backbutton", exitApp, false);

                app.setBackwardFired(false);
            },
            beforeDeactivate: function()
            {
                var listContainer = dom.byId('listContainerStart');
                listScrollTop = listContainer.scrollTop;

                hideMenuDialog();
                document.removeEventListener("backbutton", exitApp, false);
            },
            destroy:function ()
            {
                var connectResult = _connectResults.pop();
                while (connectResult)
                {
                    connect.disconnect(connectResult);
                    connectResult = _connectResults.pop();
                }

                document.removeEventListener("backbutton", exitApp, false);
            }
        }
    });