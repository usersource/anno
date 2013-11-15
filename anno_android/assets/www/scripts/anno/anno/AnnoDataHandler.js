define(["../common/Util"], function(annoUtil){

    var insert_anno_sql = "insert into feedback_comment(created,last_update,comment,screenshot_key,x,y,direction,app_version,os_version,is_moved,level,app_name,model,source,os_name,anno_type,synched)"+
        " values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    var insert_anno_draw_sql = "insert into feedback_comment(draw_elements,draw_is_anonymized,created,last_update,comment,screenshot_key,x,y,direction,app_version,os_version,is_moved,level,app_name,model,source,os_name,anno_type,synched)"+
        " values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    var update_anno_synched_by_created_sql = "update feedback_comment set synched=1,object_key=? where created=?";

    var onSQLError = function(err)
    {
        console.error(JSON.stringify(err));
        alert(JSON.stringify(err));
    };

    var annoDataHandler = {

        //created, last_update,comment,screenshot_key,x,y,direction,app_version,os_version,is_moved,level,app_name,model,source,os_name,anno_type,synched
        saveAnno: function(anno, source, screenshotDirPath)
        {
            var createdTime = annoUtil.getTimeStamp();
            var params = [
                anno.draw_elements||'',
                anno.screenshot_is_anonymized?1:0,
                createdTime,
                createdTime,
                anno.anno_text,
                anno.image,
                anno.simple_x,
                anno.simple_y,
                anno.simple_circle_on_top,
                anno.app_version,
                anno.os_version,
                anno.simple_is_moved,
                anno.level,
                anno.app_name,
                anno.device_model,
                source,
                anno.os_name,
                anno.anno_type,
                0];

            executeUpdateSql(insert_anno_draw_sql,params, function(res){
                console.error(res);
            }, onSQLError);

            this.saveAnnoToCloud(anno, screenshotDirPath, createdTime);
        },
        saveAnnoToCloud: function(anno, screenshotDirPath, createdTime)
        {
            if (!annoUtil.hasConnection()) return;

            var self = this;

            annoUtil.showLoadingIndicator();
            anno.simple_circle_on_top = anno.simple_circle_on_top==1;
            anno.simple_is_moved = anno.simple_is_moved==1;

            annoUtil.getBase64FileContent(screenshotDirPath+"/"+anno.image, function(base64Str){
                anno.image = base64Str;

                var insertAnno = gapi.client.anno.anno.insert(anno);
                insertAnno.execute(function (data)
                {
                    if (!data)
                    {
                        annoUtil.hideLoadingIndicator();
                        alert("Anno returned from server are empty.");
                        return;
                    }

                    if (data.error)
                    {
                        annoUtil.hideLoadingIndicator();
                        alert("An error occurred when calling anno.insert api: "+data.error.message);
                        return;
                    }

                    console.error(JSON.stringify(data.result));

                    self.updateAnnoSynchedStateByCreated(data.result.id, createdTime);
                    annoUtil.hideLoadingIndicator();

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
                });
            });
        },
        updateAnnoSynchedStateByCreated: function(cloudKey, ct)
        {
            executeUpdateSql(update_anno_synched_by_created_sql,[cloudKey, ct], function(res){

            }, onSQLError);
        }
    };

    return annoDataHandler;
});