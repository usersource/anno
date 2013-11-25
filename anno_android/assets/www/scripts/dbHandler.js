var annoDB = null;
var dbIsReady = false;
document.addEventListener("deviceready", initDB, false);

var createCommentTableScript = '\
    create table if not exists feedback_comment\
(\
    _id integer primary key autoincrement,\
    comment text not null,\
    screenshot_key text not null,\
    x integer not null,\
    y integer not null,\
    direction integer not null,\
    app_version text,\
    os_version text,\
    last_update integer not null,\
    object_key text,\
    is_moved integer not null,\
    level integer not null,\
    app_name text,\
    model text,\
    source text,\
    os_name text default \'Android\',\
    anno_type text default \'simple comment\',\
    synched integer default 0,\
    created integer default 0,\
    draw_elements text,\
    draw_is_anonymized integer default 0\
)';

var createCommentTableIndexScript = "CREATE INDEX feedback_comment_created ON feedback_comment(created)";

var createSettingsTableScript = '\
    create table if not exists app_settings\
(\
    _id integer primary key autoincrement,\
    item text not null,\
    value text\
)';

function initDB()
{
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
        localFileSystem = fs;
    });

    annoDB = window.sqlitePlugin.openDatabase({name: "anno", bgType2: 1});
    checkTables();
}

function checkTables()
{
    annoDB.executeSql("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='feedback_comment'", [], function(res) {
        if (res.rows.item(0).cnt == 1)
        {
            doUpgrade();
            dbIsReady = true;
        }
        else
        {
            initTables();
        }
    });
}

function initTables()
{
    annoDB.transaction(function(tx) {
        tx.executeSql(createCommentTableScript);
        tx.executeSql(createCommentTableIndexScript);
        tx.executeSql(createSettingsTableScript);
        tx.executeSql("insert into app_settings(item, value) values('ServerURL','1')");
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
        }

        if (!tempObj["anno_type"])
        {
            annoDB.executeSql("alter table feedback_comment add column anno_type text default 'Simple Comment'", [], function(res){
                console.error("anno_type column added.");
            });
        }

        if (!tempObj["synched"])
        {
            annoDB.executeSql("alter table feedback_comment add column synched integer default 0", [], function(res){
                console.error("synched column added.");
            });
        }

        if (!tempObj["created"])
        {
            annoDB.executeSql("alter table feedback_comment add column created integer default 0", [], function(res){
                console.error("created column added.");
            });

            annoDB.executeSql('CREATE INDEX feedback_comment_created ON feedback_comment(created)');
        }

        if (!tempObj["draw_elements"])
        {
            annoDB.executeSql("alter table feedback_comment add column draw_elements text", [], function(res){
                console.error("draw_elements column added.");
            });
        }

        if (!tempObj["draw_is_anonymized"])
        {
            annoDB.executeSql("alter table feedback_comment add column draw_is_anonymized integer default 0", [], function(res){
                console.error("draw_is_anonymized column added.");
            });
        }
    });

    annoDB.executeSql("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='app_settings'", [], function(res) {
        console.error("app_settings "+res.rows.item(0).cnt);
        if (res.rows.item(0).cnt == 0)
        {
            annoDB.executeSql(createSettingsTableScript);
            annoDB.executeSql("insert into app_settings(item, value) values('ServerURL','1')");
        }
    });
}

function executeSelectSql(sql, params, onSuccess, onFail)
{
    annoDB.executeSql(sql, params, onSuccess, onFail);
}

function executeUpdateSql(sql, params, onSuccess, onFail)
{
    console.error(JSON.stringify(annoDB));
    annoDB.executeSql(sql, params, onSuccess, onFail);
}

function onSQLError(err)
{
    console.error(JSON.stringify(err));
    alert(JSON.stringify(err));
}