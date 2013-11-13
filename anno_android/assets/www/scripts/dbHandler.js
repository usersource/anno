var annoDB = null;
var dbIsReady = false;
document.addEventListener("deviceready", initDB, false);

function initDB()
{
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
        localFileSystem = fs;
    });

    annoDB = window.sqlitePlugin.openDatabase({name: "anno", bgType: 1});
    checkTables();
}

function checkTables()
{
    annoDB.executeSql("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='feedback_comment'", [], function(res) {
        console.error("feedback_comment table found? "+ res.rows.item(0).cnt);
        if (res.rows.item(0).cnt == 1)
        {
            doUpgrade();
            annoDB.executeSql("select * from feedback_comment", [], function(resf) {
                console.error("feedback_comment data: "+JSON.stringify(resf.rows.item(0)));
            });

            dbIsReady = true;
        }
        else
        {
            //initTables();
        }
    });

}

function initTables()
{
    annoDB.transaction(function(tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS app_settings (id integer primary key, userpin text, settingsjson text)');

        dbIsReady = true;
    });
}

function doUpgrade()
{
    // check if the db schema need be upgraded.
    annoDB.executeSql("pragma table_info (feedback_comment);", [], function(res) {
        var rows = res.rows;
        var tempObj = {};
        for (var i=0;i<rows.length;i++)
        {
            var item = rows.item(i);
            tempObj[item.name] = item;
        }

        console.error("doUpgrade "+JSON.stringify(tempObj));

        if (!tempObj["os_name"])
        {
            annoDB.executeSql("alter table feedback_comment add column os_name text default 'Android'", [], function(res){
                console.error("os_name column added.");
            });

            annoDB.executeSql("alter table feedback_comment add column anno_type text default 'Simple Comment'", [], function(res){
                console.error("anno_type column added.");
            });

            annoDB.executeSql("alter table feedback_comment add column synched integer default 0", [], function(res){
                console.error("synched column added.");
            });

            annoDB.executeSql("alter table feedback_comment add column created integer default 0", [], function(res){
                console.error("created column added.");
            });

            annoDB.executeSql('CREATE INDEX feedback_comment_created ON feedback_comment(created)');

            annoDB.executeSql("alter table feedback_comment add column draw_elements text", [], function(res){
                console.error("draw_elements column added.");
            });

            annoDB.executeSql("alter table feedback_comment add column draw_is_anonymized integer default 0", [], function(res){
                console.error("draw_is_anonymized column added.");
            });
        }
    });
}

function executeSelectSql(sql, params, onSuccess, onFail)
{
    annoDB.executeSql(sql, params, onSuccess, onFail);
}

function executeUpdateSql(sql, params, onSuccess, onFail)
{
    annoDB.executeSql(sql, params, onSuccess, onFail);
}