create table if not exists app_settings
(
    _id integer primary key autoincrement,
    item text not null,
    value text
)