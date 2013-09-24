/**
 * 
 */
package io.usersource.annoplugin.datastore;

import java.util.ArrayList;
import java.util.List;

import android.content.ContentValues;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

/**
 * Table adapter for comment manipulation.
 * 
 * @author topcircler
 * 
 */
public class TableCommentFeedbackAdapter extends AbstractTableAdapter {
  // TODO: when to close database connection.

  /* table column names. */
  public static final String COL_ID = "_id";
  public static final String COL_COMMENT = "comment";
  public static final String COL_SCREENSHOT_KEY = "screenshot_key";
  public static final String COL_POSITION_X = "x";
  public static final String COL_POSITION_Y = "y";
  public static final String COL_DIRECTION = "direction";
  public static final String COL_APP_NAME = "app_name";
  public static final String COL_MODEL = "model";
  public static final String COL_APP_VERSION = "app_version";
  public static final String COL_OS_VERSION = "os_version";
  public static final String COL_MOVED = "is_moved"; // 0 - not move, 1 - moved.
  public static final String COL_LEVEL = "level"; // 1 or 2.
  // col_timestamp & col_object_key is used for synchronization
  public static final String COL_TIMESTAMP = "last_update";
  public static final String COL_OBJECT_KEY = "object_key";
  public static final String COL_SOURCE = "source";

  public static final String TABLE_NAME = "feedback_comment";

  public TableCommentFeedbackAdapter(SQLiteOpenHelper sqliteOpenHelper) {
    super(sqliteOpenHelper);
  }

  @Override
  public String getTableName() {
    return TABLE_NAME;
  }

  @Override
  public List<String> getInitSqls() {
    String createTableSql = String.format("create table %s "
        + "(%s integer primary key autoincrement, " + "%s text not null, "
        + "%s text not null, " + "%s integer not null, "
        + "%s integer not null, " + "%s integer not null, " + "%s text, "
        + "%s text," + "%s integer not null, " + "%s text, "
        + "%s integer not null, " + "%s integer not null, %s text, %s text, %s text);",
        TABLE_NAME, COL_ID, COL_COMMENT, COL_SCREENSHOT_KEY, COL_POSITION_X,
        COL_POSITION_Y, COL_DIRECTION, COL_APP_VERSION, COL_OS_VERSION,
        COL_TIMESTAMP, COL_OBJECT_KEY, COL_MOVED, COL_LEVEL, COL_APP_NAME,
        COL_MODEL, COL_SOURCE);

    List<String> initSqls = new ArrayList<String>();
    initSqls.add(createTableSql);
    return initSqls;
  }

  @Override
  public long insert(ContentValues values) {
    values.put(COL_TIMESTAMP, System.currentTimeMillis());
    SQLiteDatabase database = sqliteOpenHelper.getWritableDatabase();
    return database.insert(getTableName(), null, values);
  }

}
