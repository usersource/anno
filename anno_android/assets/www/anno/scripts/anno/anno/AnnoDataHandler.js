define(["../common/DBUtil", "../common/Util","../common/OAuthUtil"], function(DBUtil, annoUtil, OAuthUtil){

    var insert_anno_draw_sql = "insert into feedback_comment(draw_elements,draw_is_anonymized,created,last_update,comment,screenshot_key,x,y,direction,app_version,os_version,is_moved,level,app_name,model,source,os_name,anno_type,synched)"+
        " values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    var update_anno_synched_by_created_sql = "update feedback_comment set synched=1,object_key=? where created=?";
    var update_anno_synched_by_id_sql = "update feedback_comment set synched=1,object_key=? where _id=?";
    var select_anno_sql = "select * from feedback_comment where synched=0";
    var select_anno_sync_sql = "select * from feedback_comment where synched=0 LIMIT 1";
    var save_userInfo_sql = "insert into app_users(userid,email,signinmethod,nickname,password,signedup) values (?,?,?,?,?,?)";
    var select_userInfo_sql = "select * from app_users";
    var delete_userInfo_sql = "delete from app_users";

    var annoDataHandler = {
        duplicateMsgPrefix:"Duplicate anno",
        syncInterval: 5*60*1000,
        localAnnoSaved: false,
        localAnnoCreatedTime: 0,
        localAnnoCreatedTimeString: "",
        //created, last_update,comment,screenshot_key,x,y,direction,app_version,os_version,is_moved,level,app_name,model,source,os_name,anno_type,synched
        saveAnno: function(anno, source, screenshotDirPath)
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
                    anno.simple_x,
                    anno.simple_y,
                    anno.simple_circle_on_top?1:0,
                    anno.app_version,
                    anno.os_version,
                    anno.simple_is_moved?1:0,
                    anno.level,
                    anno.app_name,
                    anno.device_model,
                    source,
                    anno.os_name,
                    anno.anno_type,
                    0];

                DBUtil.executeUpdateSql(insert_anno_draw_sql,params, function(res){
                    console.error(res);
                    self.localAnnoSaved = true;
                }, onSQLError);
            }

            //anno["created"] = this.localAnnoCreatedTimeString;
            this.saveAnnoToCloud(anno, screenshotDirPath, this.localAnnoCreatedTime, false);
        },
        saveAnnoToCloud: function(anno, screenshotDirPath, createdTime, background, callback)
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

            if (!background)
            {
                annoUtil.showLoadingIndicator();
            }

            anno.simple_circle_on_top = anno.simple_circle_on_top==1;
            anno.simple_is_moved = anno.simple_is_moved==1;

            annoUtil.getBase64FileContent(screenshotDirPath+"/"+anno.image, function(base64Str){
                anno.image = base64Str;

                OAuthUtil.getAccessToken(function(){
                    annoUtil.loadAPI(annoUtil.API.anno, function(){
                        var insertAnno = gapi.client.anno.anno.insert(anno);
                        console.error("start insert anno."+insertAnno);
                        insertAnno.execute(function (data)
                        {
                            if (!data)
                            {
                                annoUtil.hideLoadingIndicator();

                                if (background)
                                {
                                    console.error("response returned from server are empty.");
                                }
                                else
                                {
                                    alert("response returned from server are empty.");
                                }

                                if (callback)
                                {
                                    callback();
                                }

                                return;
                            }

                            if (data.error)
                            {
                                annoUtil.hideLoadingIndicator();

                                if (background)
                                {
                                    console.error("An error occurred when calling anno.insert api: "+data.error.message);
                                }
                                else
                                {
                                    alert("An error occurred when calling anno.insert api: "+data.error.message);
                                }

                                if (callback)
                                {
                                    callback();
                                }

                                if (data.error.message.indexOf(self.duplicateMsgPrefix) != 0)
                                {
                                    return;
                                }
                            }

                            console.error(JSON.stringify(data.result));

                            if (background)
                            {
                                var serverAnnoId;

                                if (data.result)
                                {
                                    serverAnnoId = data.result.id;
                                }
                                else
                                {
                                    serverAnnoId = /\d+/.exec(data.error.message);

                                    serverAnnoId = serverAnnoId?serverAnnoId[0]:"";
                                }

                                console.error("got serverAnnoId:"+serverAnnoId);
                                self.updateAnnoSynchedStateById(serverAnnoId, createdTime);
                            }
                            else
                            {
                                self.updateAnnoSynchedStateByCreated(data.result.id, createdTime);
                            }

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
                                    ["Your comment has been shared."]
                                );
                            }

                            if (callback)
                            {
                                callback();
                            }
                        });
                    });
                });
            });
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
        loadLocalAnnos: function(callback)
        {
            DBUtil.executeUpdateSql(select_anno_sql,[], function(res){
                if (!res) return;

                var annos = [];
                var cnt = res.rows.length;
                console.error('local annos: '+cnt);

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

            var self = this;
            DBUtil.executeUpdateSql(select_anno_sync_sql,[], function(res){
                if (!res) return;
                var cnt = res.rows.length;

                if (cnt)
                {
                    console.error('startBackgroundSync annos: '+cnt);

                    var item = res.rows.item(0);
                    var createdTime = new Date(parseInt(item.created));
                    var formattedCreatedTime = createdTime.getFullYear()+'-'+(createdTime.getMonth()+1)+'-'+createdTime.getDate()+"T"+createdTime.getHours()+":"+createdTime.getMinutes()+":"+createdTime.getSeconds();

                    console.error('startBackgroundSync annos: '+JSON.stringify(item));
                    var annoItem = {
                        "anno_text":item.comment,
                        "image":item.screenshot_key,
                        "simple_x":item.x,
                        "simple_y":item.y,
                        "simple_circle_on_top":item.direction,
                        "app_version":item.app_version,
                        "simple_is_moved":item.is_moved,
                        "level":item.level,
                        "app_name":item.app_name,
                        "device_model":item.model,
                        "os_name":item.os_name,
                        "os_version":item.os_version,
                        "anno_type":item.anno_type,
                        "screenshot_is_anonymized":item.draw_is_anonymized==1,
                        "draw_elements":item.draw_elements,
                        "created":formattedCreatedTime
                    };

                    annoUtil.getAnnoScreenshotPath(function(scPath){
                        self.saveAnnoToCloud(annoItem, scPath, item._id, true, function(){
                            window.setTimeout(function(){
                                annoDataHandler.startBackgroundSync();
                            }, annoDataHandler.syncInterval);
                        });
                    });
                }
                else
                {
                    window.setTimeout(function(){
                        annoDataHandler.startBackgroundSync();
                    }, annoDataHandler.syncInterval);
                }

            }, function(err){
                console.error("startBackgroundSync: "+err);
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
                console.error('user cnt: '+cnt);
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
                console.error("user removed.");
                if (callback)
                {
                    callback();
                }
            }, onSQLError);
        }
    };

    return annoDataHandler;
});