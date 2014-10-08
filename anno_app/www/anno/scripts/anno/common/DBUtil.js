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
        reconnectToDB:function()
        {
            this.annoDB = window.sqlitePlugin.openDatabase({name: "anno", bgType2: 1});
            console.log("db reconnected.");
        },
        checkTables: function()
        {
            var self = this;
            this.annoDB.executeSql("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='feedback_comment'", [], function(res) {
                if (!res) return;

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

                console.log("dbIsReady! ");
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
                //tx.executeSql("insert into app_settings(item, value) values('ServerURL','1')");
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
                if (!res) return;

                // console.log("app_users " + res.rows.item(0).cnt);

                if (res.rows.item(0).cnt == 0)
                {
                    self.annoDB.executeSql(usersSQL);
                    self.userChecked = true;
                }
                else
                {
                    // check if the db schema need be upgraded.
                    self.annoDB.executeSql("pragma table_info (app_users);", [], function(pres) {
                        if (!pres) return;

                        var rows = pres.rows;
                        var tempObj = {};
                        for (var i=0;i<rows.length;i++)
                        {
                            var item = rows.item(i);
                            tempObj[item.name] = item;
                        }

                        // console.error("doUpgrade "+JSON.stringify(tempObj));

                        if (!tempObj["signedup"])
                        {
                            self.annoDB.executeSql("alter table app_users add column signedup integer default 0", [], function(pures){
                                console.log("signedup column added.");

                                self.annoDB.executeSql("update app_users set signedup=?", [1], function(pures){
                                    if (pures)
                                    {
                                        self.annoDB.executeSql("select * from app_users", [], function(psres){
                                            if (psres)
                                            {
                                                console.log("app_users2: " + psres.rows.length);
                                                self.hasUserInLocalDB = psres.rows.length>0;
                                                if (psres.rows.length>0)
                                                    self.localUserInfo = psres.rows.item(0);
                                                self.userChecked = true;
                                                console.log("app_users: " + JSON.stringify(self.localUserInfo));
                                            }
                                        });
                                    }
                                });
                            });
                        }
                        else
                        {
                            self.annoDB.executeSql("select * from app_users", [], function(ures){
                                if (ures)
                                {
                                    // console.log("app_users2: " + ures.rows.length);
                                    self.hasUserInLocalDB = ures.rows.length>0;
                                    if (ures.rows.length>0)
                                        self.localUserInfo = ures.rows.item(0);
                                    self.userChecked = true;
                                    // console.error("app_users: "+JSON.stringify(self.localUserInfo));
                                }
                            });
                        }

                    });
                }
            });

            // check if the db schema need be upgraded.
            this.annoDB.executeSql("pragma table_info (feedback_comment);", [], function(res) {
                if (!res) return;

                // console.error("doUpgrade "+JSON.stringify(tempObj));
                var columns = [
                    {name:'_id', type:'integer', extra:'primary key autoincrement'},
                    {name:'comment', type:'text', constraint:'not null'},
                    {name:'screenshot_key', type:'text', constraint:'not null'},
                    {name:'app_version', type:'text'},
                    {name:'os_version', type:'text'},
                    {name:'last_update', type:'integer', constraint:'not null'},
                    {name:'object_key', type:'text'},
                    {name:'level', type:'integer', constraint: 'not null'},
                    {name:'app_name', type:'text'},
                    {name:'model', type:'text'},
                    {name:'source', type:'text'},
                    {name:'os_name', type:'text', 'default':"'Android'"},
                    {name:'anno_type', type:'text', 'default':"'simple comment'"},
                    {name:'synched', type:'integer', 'default':0},
                    {name:'created', type:'VARCHAR(30)', 'default':"'0'"},
                    {name:'draw_elements', type:'text'},
                    {name:'draw_is_anonymized', type:'integer', 'default':0},
                    // {name:'column_is_anonymized', type:'integer', 'default':0}
                ];

                var rows = res.rows;
                var tempObj = {};
                var name_list = [];
                for (var i=0;i<rows.length;i++)
                {
                    var item = rows.item(i);
                    tempObj[item.name] = item;
                    name_list.push(item.name);
                }

                

                for(var i = 0; i < columns.length; i ++) {
                    if (tempObj[columns[i].name]) {
                        name_list.splice(name_list.indexOf(columns[i].name), 1);
                        continue;
                    }

                    var alter_stmnt = 'alter table feedback_comment add column ' + columns[i].name + ' ' + columns[i].type;
                    if (columns[i].constraint !== undefined)
                        alter_stmnt += (' ' + columns[i].constraint);
                    if (columns[i].default !== undefined)
                        alter_stmnt += (' default ' + columns[i].default);
                    if (columns[i].extra !== undefined)
                        alter_stmnt += (' ' + columns[i].extra);

                    console.log("Do Upgrade Schema: " + alter_stmnt);
                    self.annoDB.executeSql(alter_stmnt, [], function(res) {
                        console.log("Add Column: " + JSON.stringify(res));
                    }); 
                }

                // No Drop column support in SQLite
                // for (var i = 0; i < name_list.length; i ++) {
                //     alter_stmnt = "alter table feedback_comment drop " + name_list[i];
                //     console.error(alter_stmnt);
                //     self.annoDB.executeSql(alter_stmnt, [], function(res) {
                //         console.error("Drop Column: " + JSON.stringify(res));
                //     }); 
                // }

            });

            this.annoDB.executeSql("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='app_settings'", [], function(res) {
                if (!res) return;

                // console.log("app_settings " + res.rows.item(0).cnt);
                if (res.rows.item(0).cnt == 0)
                {
                    self.annoDB.executeSql(settingsSQL);
                    //self.annoDB.executeSql("insert into app_settings(item, value) values('ServerURL','1')");

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
        loadLocalUserInfo: function()
        {
            var self = this;
            this.annoDB.executeSql("select * from app_users", [], function(psres){
                if (psres)
                {
                    self.hasUserInLocalDB = psres.rows.length>0;
                    if (psres.rows.length>0)
                        self.localUserInfo = psres.rows.item(0);
                    self.userChecked = true;
                    console.log("app_users: " + JSON.stringify(self.localUserInfo));
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