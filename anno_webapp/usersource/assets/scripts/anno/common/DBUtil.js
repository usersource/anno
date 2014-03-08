define([
    "dojo/_base/declare",
    "dojo/text!./dbscripts/feedback.sql",
    "dojo/text!./dbscripts/settings.sql",
    "dojo/text!./dbscripts/users.sql"
], function (declare, feedbackSQL, settingsSQL, usersSQL)
{
    var onSQLError = window.onSQLError = function (err)
    {
        console.error(JSON.stringify(err));
        alert(JSON.stringify(err));
    };

    var dbUtil = {
        annoDB: null,
        firstInstall:false,
        dbIsReady:false,
        userChecked:false,
        hasUserInLocalDB:false,
        localUserInfo:null,
        createCommentTableIndexScript: "CREATE INDEX feedback_comment_created ON feedback_comment(created)",
        initDB: function(callback)
        {
            this.callback = callback;
            this.annoDB = window.sqlitePlugin.openDatabase({name: "anno", bgType2: 1});
            this.checkTables();

            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
                localFileSystem = fs;
            });
        },
        checkTables: function()
        {
            var self = this;
            this.annoDB.executeSql("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='feedback_comment'", [], function(res) {
                if (res.rows.item(0).cnt == 1)
                {
                    self.doUpgrade();
                    self.dbIsReady = true;
                }
                else
                {
                    self.firstInstall = true;
                    self.initTables();
                }

                console.error("dbIsReady! ");
            });
        },
        initTables: function()
        {
            var self = this;
            this.annoDB.transaction(function(tx) {
                tx.executeSql(feedbackSQL);
                tx.executeSql(self.createCommentTableIndexScript);
                tx.executeSql(settingsSQL);
                tx.executeSql(usersSQL);
                tx.executeSql("insert into app_settings(item, value) values('ServerURL','1')");
                self.dbIsReady = true;
                self.userChecked = true;

                if (self.callback)
                {
                    window.setTimeout(function(){
                        self.callback();
                    }, 5);
                }
            });
        },
        doUpgrade: function()
        {
            var self = this;
            this.annoDB.executeSql("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='app_users'", [], function(res) {
                console.error("app_users "+res.rows.item(0).cnt);

                if (res.rows.item(0).cnt == 0)
                {
                    self.annoDB.executeSql(usersSQL);
                    self.userChecked = true;
                }
                else
                {
                    self.annoDB.executeSql("select * from app_users", [], function(ures){
                        if (ures)
                        {
                            console.error("app_users2: "+ures.rows.length);
                            self.hasUserInLocalDB = ures.rows.length>0;
                            if (ures.rows.length>0)
                                self.localUserInfo = ures.rows.item(0);
                            self.userChecked = true;
                            console.error("app_users: "+JSON.stringify(self.localUserInfo));
                        }
                    });
                }
            });

            // check if the db schema need be upgraded.
            this.annoDB.executeSql("pragma table_info (feedback_comment);", [], function(res) {
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
                    self.annoDB.executeSql("alter table feedback_comment add column os_name text default 'Android'", [], function(res){
                        console.error("os_name column added.");
                    });
                }

                if (!tempObj["anno_type"])
                {
                    self.annoDB.executeSql("alter table feedback_comment add column anno_type text default 'Simple Comment'", [], function(res){
                        console.error("anno_type column added.");
                    });
                }

                if (!tempObj["synched"])
                {
                    self.annoDB.executeSql("alter table feedback_comment add column synched integer default 0", [], function(res){
                        console.error("synched column added.");
                    });
                }

                if (!tempObj["created"])
                {
                    self.annoDB.executeSql("alter table feedback_comment add column created VARCHAR(30) default '0'", [], function(res){
                        console.error("created column added.");
                    });

                    self.annoDB.executeSql('CREATE INDEX feedback_comment_created ON feedback_comment(created)');
                }

                if (!tempObj["draw_elements"])
                {
                    self.annoDB.executeSql("alter table feedback_comment add column draw_elements text", [], function(res){
                        console.error("draw_elements column added.");
                    });
                }

                if (!tempObj["draw_is_anonymized"])
                {
                    self.annoDB.executeSql("alter table feedback_comment add column draw_is_anonymized integer default 0", [], function(res){
                        console.error("draw_is_anonymized column added.");
                    });
                }
            });

            this.annoDB.executeSql("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='app_settings'", [], function(res) {
                console.error("app_settings "+res.rows.item(0).cnt);
                if (res.rows.item(0).cnt == 0)
                {
                    self.annoDB.executeSql(settingsSQL);
                    self.annoDB.executeSql("insert into app_settings(item, value) values('ServerURL','1')");

                    if (self.callback)
                    {
                        window.setTimeout(function(){
                            self.callback();
                        }, 5);
                    }
                }
                else
                {
                    if (self.callback)
                    {
                        window.setTimeout(function(){
                            self.callback();
                        }, 5);
                    }
                }
            });
        },
        executeSelectSql: function(sql, params, onSuccess, onFail)
        {
            this.annoDB.executeSql(sql, params, onSuccess, onFail);
        },
        executeUpdateSql: function (sql, params, onSuccess, onFail)
        {
            this.annoDB.executeSql(sql, params, onSuccess, onFail);
        }
    };

    return dbUtil;
});