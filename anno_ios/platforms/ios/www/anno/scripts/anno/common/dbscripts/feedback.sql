create table if not exists feedback_comment
(
    _id integer primary key autoincrement,
    comment text not null,
    screenshot_key text not null,
    x integer not null,
    y integer not null,
    direction integer not null,
    app_version text,
    os_version text,
    last_update integer not null,
    object_key text,
    is_moved integer not null,
    level integer not null,
    app_name text,
    model text,
    source text,
    os_name text default 'Android',
    anno_type text default 'simple comment',
    synched integer default 0,
    created VARCHAR(30) default '0',
    draw_elements text,
    draw_is_anonymized integer default 0
)