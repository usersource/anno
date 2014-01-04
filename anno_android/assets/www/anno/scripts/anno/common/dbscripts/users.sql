create table if not exists app_users
(
    _id integer primary key autoincrement,
    userid text not null,
    email text not null,
    password text,
    signinmethod VARCHAR not null default 'google',
    nickname text
)