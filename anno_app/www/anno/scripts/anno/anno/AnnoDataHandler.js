define(["../common/DBUtil", "../common/Util","../common/OAuthUtil"], function(DBUtil, annoUtil, OAuthUtil){

    var insert_anno_draw_sql = "insert into feedback_comment(draw_elements,draw_is_anonymized,created,last_update,comment,screenshot_key,app_version,os_version,level,app_name,model,source,os_name,anno_type,synched)"+
        " values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    var update_anno_synched_by_created_sql = "update feedback_comment set synched=1,object_key=? where created=?";
    var update_anno_synched_by_id_sql = "update feedback_comment set synched=1,object_key=? where _id=?";
    var update_anno_synched_by_object_key_sql = "update feedback_comment set synched=1 where object_key=?";
    var select_anno_sql = "select * from feedback_comment where synched=0";
    var select_anno_by_objectKey_sql = "select _id as id from feedback_comment where object_key=?";
    // synched state: 0--non synched inserted anno, -1--non synched updated anno without image changed, -2--non synched updated anno with image changed
    var select_anno_sync_sql = "select * from feedback_comment where synched IN (0,-1,-2)";
    var save_userInfo_sql = "insert into app_users(userid,email,signinmethod,nickname,password,signedup) values (?,?,?,?,?,?)";
    var select_userInfo_sql = "select * from app_users";
    var delete_userInfo_sql = "delete from app_users";
    var insert_anno_unsynched_sql = "insert into feedback_comment(object_key,draw_elements,draw_is_anonymized,last_update,comment,screenshot_key,level,app_name,app_version,anno_type,synched)"+
        " values(?,?,?,?,?,?,?,?,?,?,?)";
    var update_anno_unsynched_sql = "update feedback_comment set draw_elements=?,comment=?,app_name=?,app_version=?,draw_is_anonymized=?,synched=? where _id=?";
    var update_anno_unsynched_including_image_sql = "update feedback_comment set screenshot_key=?,draw_elements=?,comment=?,app_name=?,app_version=?,draw_is_anonymized=?,synched=? where _id=?";

    var annoDataHandler = {
        duplicateMsgPrefix:"Duplicate anno",
        syncInterval: 5*60*1000,
        localAnnoSaved: false,
        localAnnoCreatedTime: 0,
        localAnnoCreatedTimeString: "",
        sendingAnnoToCloud: false,
        //created, last_update,comment,screenshot_key,x,y,direction,app_version,os_version,is_moved,level,app_name,model,source,os_name,anno_type,synched
        insertAnno: function(anno, source, screenshotDirPath)
        {
            var createdTime, self = this;
            if (!this.localAnnoSaved)
            {
                createdTime = this.localAnnoCreatedTime = annoUtil.getTimeStamp();
                var createdTimeObj = new Date(createdTime);
                this.localAnnoCreatedTimeString = createdTimeObj.getFullYear()+'-'+(createdTimeObj.getMonth()+1)+'-'+createdTimeObj.getDate()+"T"+createdTimeObj.getHours()+":"+createdTimeObj.getMinutes()+":"+createdTimeObj.getSeconds();

                var params = [
                    anno.draw_elements||'',
                    anno.screenshot_is_anonymized?1:0,
                    createdTime,
                    createdTime,
                    anno.anno_text,
                    anno.image,
                    // anno.simple_x,
                    // anno.simple_y,
                    // anno.simple_circle_on_top?1:0,
                    anno.app_version,
                    anno.os_version,
                    // anno.simple_is_moved?1:0,
                    anno.level,
                    anno.app_name,
                    anno.device_model,
                    source,
                    anno.os_name,
                    anno.anno_type,
                    0];

                DBUtil.executeUpdateSql(insert_anno_draw_sql,params, function(res){
                    self.localAnnoSaved = true;
                }, onSQLError);
            }
            this.insertAnnoToCloud(anno, screenshotDirPath, this.localAnnoCreatedTime, false);
        },
        insertAnnoToCloud: function(anno, screenshotDirPath, createdTime, background, callback)
        {
            if (!annoUtil.hasConnection())
            {
                annoUtil.hideLoadingIndicator();

                if (!background)
                {
                    cordova.exec(
                        function (result)
                        {
                            cordova.exec(
                                function (result)
                                {
                                },
                                function (err)
                                {
                                },
                                "AnnoCordovaPlugin",
                                'exit_current_activity',
                                []
                            );
                        },
                        function (err)
                        {
                        },
                        "AnnoCordovaPlugin",
                        'show_toast',
                        ["Your comment has been saved."]
                    );
                }

                if (callback)
                {
                    callback();
                }

                return;
            }
            else
            {
                if (!DBUtil.localUserInfo.signedup)
                {
                    if (!background)
                    {
                        cordova.exec(
                            function (result)
                            {
                                cordova.exec(
                                    function (result)
                                    {
                                    },
                                    function (err)
                                    {
                                    },
                                    "AnnoCordovaPlugin",
                                    'exit_current_activity',
                                    []
                                );
                            },
                            function (err)
                            {
                            },
                            "AnnoCordovaPlugin",
                            'show_toast',
                            ["Your comment has been saved."]
                        );
                    }

                    if (callback)
                    {
                        callback();
                    }

                    return;
                }
            }

            var self = this;
            this.sendingAnnoToCloud = true;

            if (!background)
            {
                annoUtil.showLoadingIndicator();
            }

            // anno.simple_circle_on_top = anno.simple_circle_on_top==1;
            // anno.simple_is_moved = anno.simple_is_moved==1;
            anno.simple_circle_on_top = false;
            anno.simple_is_moved = false;

            // appending platform info
            anno.platform_type = device.platform;

            annoUtil.getBase64FileContent(screenshotDirPath+"/"+anno.image, function(base64Str){
                anno.image = base64Str;
                console.log("start insert anno.");

                var APIConfig = {
                    name: annoUtil.API.anno,
                    method: "anno.anno.insert",
                    parameter: anno,
                    showLoadingSpinner: false,
                    needAuth: true,
                    showErrorMessage: !background,
                    success: function(data)
                    {
                        console.log("anno inserted.");
                        console.log(JSON.stringify(data.result));

                        if (background)
                        {
                            var serverAnnoId = data.result.id;
                            console.log("got serverAnnoId:"+serverAnnoId);

                            self.updateAnnoSynchedStateById(serverAnnoId, createdTime);
                        }
                        else
                        {
                            self.updateAnnoSynchedStateByCreated(data.result.id, createdTime);
                        }

                        if (!background)
                        {
                            annoUtil.hideLoadingIndicator();
                        }

                        if (!background)
                        {
                            cordova.exec(
                                function (result)
                                {
                                    cordova.exec(
                                        function (result)
                                        {
                                        },
                                        function (err)
                                        {
                                        },
                                        "AnnoCordovaPlugin",
                                        'exit_current_activity',
                                        []
                                    );
                                },
                                function (err)
                                {
                                },
                                "AnnoCordovaPlugin",
                                'show_toast',
                                ["Your comment has been shared."]
                            );
                        }

                        if (callback)
                        {
                            callback();
                        }

                        if (background) {
                            annoUtil.showToastDialog("A previously saved Comment has been shared", 7000);
                        }
                    },
                    error: function(error, data)
                    {
                        self.sendingAnnoToCloud = false;

                        // anno duplicated
                        if (error.message.indexOf(self.duplicateMsgPrefix) == 0)
                        {
                            var serverAnnoId = /\d+/.exec(data.error.message);
                            serverAnnoId = serverAnnoId?serverAnnoId[0]:"";
                            console.log("got serverAnnoId:"+serverAnnoId);
                            self.updateAnnoSynchedStateById(serverAnnoId, createdTime);
                        }
                        console.error("Backgrnd : " + background);
                        if (!background)
                        {
                            annoUtil.hideLoadingIndicator();
                        }
                        var msg = "We were unable to share your Comment at the moment.<br/> It has been Saved and will be shared at the earliest." +
                            "<br/><hr/> Thanks for participating."
                        annoUtil.showToastDialog(msg, 7000);
                    }
                };

                annoUtil.callGAEAPI(APIConfig);

            });
        },
        updateAnno: function(annoId, anno, screenshotDirPath, callback)
        {
            // find if there is local anno item that object_key==editAnno.id, if found then update local anno item,
            // if not found, insert a new local anno item for background sync only.
            if (!this.localAnnoSaved)
            {
                var self = this;
                DBUtil.executeUpdateSql(select_anno_by_objectKey_sql,[annoId], function(res){
                    if (!res) return;

                    var params, createdTime = annoUtil.getTimeStamp();
                    if (res.rows.length == 0)
                    {
                        params = [
                            annoId,
                            anno.draw_elements||'',
                            anno.screenshot_is_anonymized?1:0,
                            createdTime,
                            anno.anno_text,
                            anno.image||"none",
                            anno.level,
                            anno.app_name,
                            anno.app_version,
                            anno.anno_type,
                            anno.image?-2:-1
                        ];

                        DBUtil.executeUpdateSql(insert_anno_unsynched_sql,params, function(res){
                            if (!res) return;
                            self.localAnnoSaved = true;
                        }, onSQLError);

                        anno.id = annoId;
                        self.updateAnnoToCloud(anno, screenshotDirPath, false, callback);
                    }
                    else
                    {
                        params = [
                            anno.draw_elements||'',
                            anno.anno_text,
                            anno.app_name,
                            anno.app_version,
                            anno.screenshot_is_anonymized?1:0,
                            anno.image?-2:-1,
                            res.rows.item(0).id
                        ];

                        if (anno.image)
                        {
                            params.splice(0, 0, anno.image);
                        }

                        DBUtil.executeUpdateSql(anno.image?update_anno_unsynched_including_image_sql:update_anno_unsynched_sql,params, function(res){
                            if (!res) return;

                            self.localAnnoSaved = true;
                        }, onSQLError);

                        anno.id = annoId;
                        self.updateAnnoToCloud(anno, screenshotDirPath, false, callback);
                    }
                }, onSQLError);
            }
            else
            {
                anno.id = annoId;
                this.updateAnnoToCloud(anno, screenshotDirPath);
            }
        },
        updateAnnoToCloud: function(anno, screenshotDirPath, background, callback)
        {
            if (!annoUtil.hasConnection())
            {
                annoUtil.hideLoadingIndicator();

                if (!background)
                {
                    cordova.exec(
                        function (result)
                        {
                            if (callback)
                            {
                                callback();
                            }

                            cordova.exec(
                                function (result)
                                {
                                },
                                function (err)
                                {
                                },
                                "AnnoCordovaPlugin",
                                'exit_current_activity',
                                []
                            );
                        },
                        function (err)
                        {
                        },
                        "AnnoCordovaPlugin",
                        'show_toast',
                        ["Your comment has been saved."]
                    );
                }
                else
                {
                    if (callback)
                    {
                        callback();
                    }
                }

                return;
            }
            else
            {
                if (!DBUtil.localUserInfo.signedup)
                {
                    if (!background)
                    {
                        cordova.exec(
                            function (result)
                            {
                                if (callback)
                                {
                                    callback();
                                }

                                cordova.exec(
                                    function (result)
                                    {
                                    },
                                    function (err)
                                    {
                                    },
                                    "AnnoCordovaPlugin",
                                    'exit_current_activity',
                                    []
                                );
                            },
                            function (err)
                            {
                            },
                            "AnnoCordovaPlugin",
                            'show_toast',
                            ["Your comment has been saved."]
                        );
                    }
                    else
                    {
                        if (callback)
                        {
                            callback();
                        }
                    }

                    return;
                }
            }

            var self = this;

            if (!background)
            {
                annoUtil.showLoadingIndicator();
            }

            if (anno.image)
            {
                annoUtil.getBase64FileContent(screenshotDirPath+"/"+anno.image, function(base64Str){
                    anno.image = base64Str;
                    self._doUpdateAnnoToCloud(anno, background, callback);
                });
            }
            else
            {
                this._doUpdateAnnoToCloud(anno, background, callback);
            }
        },
        _doUpdateAnnoToCloud: function(anno, background, callback)
        {
            var self = this;
            self.sendingAnnoToCloud = true;

            if (!background)
            {
                annoUtil.showLoadingIndicator();
            }

            console.log("start update anno.");

            // appending platform info
            anno.platform_type = device.platform;

            var APIConfig = {
                name: annoUtil.API.anno,
                method: "anno.anno.merge",
                parameter: anno,
                showLoadingSpinner: false,
                needAuth: true,
                showErrorMessage: !background,
                success: function(data)
                {
                    self.updateAnnoSynchedStateByObjectKey(anno.id);
                    console.log("update anno succeeded.");

                    if (!background)
                    {
                        cordova.exec(
                            function (result)
                            {
                                if (callback)
                                {
                                    callback(data);
                                }

                                cordova.exec(
                                    function (result)
                                    {
                                    },
                                    function (err)
                                    {
                                    },
                                    "AnnoCordovaPlugin",
                                    'exit_current_activity',
                                    []
                                );
                            },
                            function (err)
                            {
                            },
                            "AnnoCordovaPlugin",
                            'show_toast',
                            ["Your comment has been updated."]
                        );
                    }
                    else
                    {
                        if (callback)
                        {
                            callback(data);
                        }
                    }

                    self.sendingAnnoToCloud = false;
                },
                error: function(error, data)
                {
                    self.sendingAnnoToCloud = false;
                }
            };

            annoUtil.callGAEAPI(APIConfig);
        },
        updateAnnoSynchedStateByCreated: function(cloudKey, ct)
        {
            DBUtil.executeUpdateSql(update_anno_synched_by_created_sql,[cloudKey, ct], function(res){

            }, onSQLError);
        },
        updateAnnoSynchedStateById: function(cloudKey, ct)
        {
            DBUtil.executeUpdateSql(update_anno_synched_by_id_sql,[cloudKey, ct], function(res){

            }, onSQLError);
        },
        updateAnnoSynchedStateByObjectKey: function(cloudKey)
        {
            DBUtil.executeUpdateSql(update_anno_synched_by_object_key_sql,[cloudKey], function(res){

            }, onSQLError);
        },
        loadLocalAnnos: function(callback)
        {
            DBUtil.executeUpdateSql(select_anno_sql,[], function(res){
                if (!res) return;

                var annos = [];
                var cnt = res.rows.length;
                console.log('local annos: ' + cnt);

                for (var i=0;i<cnt;i++)
                {
                    annos.push(res.rows.item(i));
                }

                callback(annos);
            }, function(err){
                console.error("loadLocalAnnos: "+err);
                callback([]);
            });
        },
        startBackgroundSync: function()
        {
            var inAnnoApp = document.getElementById('modelApp_home')!= null;
            var appKey = annoUtil.getSettings().appKey;
            if (!inAnnoApp&&!appKey) return;

            if (this.sendingAnnoToCloud)
            {
                annoUtil.startBackgroundSyncTimer = window.setTimeout(function() {
                    annoDataHandler.startBackgroundSync();
                }, annoDataHandler.syncInterval);
                return;
            }

            var self = this;
            DBUtil.executeUpdateSql(select_anno_sync_sql,[], function(res){
                if (!res) return;
                var cnt = res.rows.length;

                if (cnt)
                {

                    for (var i = 0; i < cnt; i ++) {
                        var item = res.rows.item(i);
                        var synchedState = item.synched, annoItem;
                    }

                    var item = res.rows.item(0);

                    if (synchedState == 0)
                    {
                        annoItem = {
                            "anno_text":item.comment,
                            "image":item.screenshot_key,
                            // "simple_x":item.x,
                            // "simple_y":item.y,
                            // "simple_circle_on_top":item.direction,
                            "app_version":item.app_version,
                            // "simple_is_moved":item.is_moved,
                            "level":item.level,
                            "app_name":item.app_name,
                            "device_model":item.model,
                            "os_name":item.os_name,
                            "os_version":item.os_version,
                            "anno_type":item.anno_type,
                            "screenshot_is_anonymized":item.draw_is_anonymized==1,
                            "draw_elements":item.draw_elements
                        };

                        annoUtil.getAnnoScreenshotPath(function(scPath){
                            self.insertAnnoToCloud(annoItem, scPath, item._id, true, function(){
                                annoUtil.startBackgroundSyncTimer = window.setTimeout(function() {
                                    annoDataHandler.startBackgroundSync();
                                }, annoDataHandler.syncInterval);
                            });
                        });
                    }
                    else if (synchedState == -1)
                    {
                        annoItem = {
                            "id": item.object_key,
                            "anno_text":item.comment,
                            "app_name":item.app_name,
                            "app_version":item.app_version,
                            "draw_elements":item.draw_elements,
                            "screenshot_is_anonymized":item.draw_is_anonymized==1
                        };

                        self.updateAnnoToCloud(annoItem, "", true, function(){
                            annoUtil.startBackgroundSyncTimer = window.setTimeout(function() {
                                annoDataHandler.startBackgroundSync();
                            }, annoDataHandler.syncInterval);
                        });
                    }
                    else
                    {
                        annoItem = {
                            "id": item.object_key,
                            "image":item.screenshot_key,
                            "anno_text":item.comment,
                            "app_name":item.app_name,
                            "app_version":item.app_version,
                            "draw_elements":item.draw_elements,
                            "screenshot_is_anonymized":item.draw_is_anonymized==1
                        };

                        annoUtil.getAnnoScreenshotPath(function(scPath){
                            self.updateAnnoToCloud(annoItem, scPath, true, function(){
                                annoUtil.startBackgroundSyncTimer = window.setTimeout(function() {
                                    annoDataHandler.startBackgroundSync();
                                }, annoDataHandler.syncInterval);
                            });
                        });
                    }
                }
                else
                {
                    annoUtil.startBackgroundSyncTimer = window.setTimeout(function() {
                        annoDataHandler.startBackgroundSync();
                    }, annoDataHandler.syncInterval);
                }

            }, function(err){
            });
        },
        saveUserInfo: function(userInfo, callback)
        {
            console.error("saveUserInfo invoked.");
            this.removeUser(function(){
                DBUtil.executeUpdateSql(save_userInfo_sql,[userInfo.userId, userInfo.email, userInfo.signinMethod, userInfo.nickname, userInfo.password||'', userInfo.signedup==null?1:userInfo.signedup], function(res){
                    if (!res) return;
                    console.error("save userInfo end:"+ JSON.stringify(res));
                    if (callback)
                    {
                        console.error("saveUserInfo callback invoked.");
                        callback();
                    }
                }, onSQLError);
            });
        },
        getCurrentUserInfo: function(callback)
        {
            DBUtil.executeUpdateSql(select_userInfo_sql,[], function(res){
                if (!res) return;

                var cnt = res.rows.length;
                console.log('user cnt: ' + cnt);
                var userInfo = {};

                if (cnt >0)
                {
                    var data = res.rows.item(0);

                    userInfo.userId = data.userid;
                    userInfo.email = data.email;
                    userInfo.password = data.password;
                    userInfo.signinMethod = data.signinmethod;
                    userInfo.nickname = data.nickname;
                    userInfo.signedup = data.signedup;
                }

                window.currentUserInfo = userInfo;
                if (callback) callback(userInfo);
            }, onSQLError);
        },
        removeUser: function(callback)
        {
            DBUtil.executeUpdateSql(delete_userInfo_sql,[], function(res){
                if (!res) return;
                console.log("user removed.");
                if (callback)
                {
                    callback();
                }
            }, onSQLError);
        }
    };

    return annoDataHandler;
});