/**
 * 
 */
package io.usersource.annoplugin.datastore;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

/**
 * This class intends to provide access and creation routines for Anno program
 * database.
 * 
 * @author topcircler
 * 
 */
public class AnnoSQLiteOpenHelper extends SQLiteOpenHelper {

  private static final String TAG = "AnnoSQLiteOpenHelper";

  public static final String DATABASE_NAME = "anno.db";
  /** Version for upgrade routines. */
  public static final int DATABASE_VERSION = 7;

  /* table adapters */
  private TableAdapter tableCommentFeedbackAdapter;
  private TableAdapter tableLastSyncAdapter;
  private TableAdapter tableUsersAdapter;

  public AnnoSQLiteOpenHelper(Context context) {
    super(context, DATABASE_NAME, null, DATABASE_VERSION);
    tableCommentFeedbackAdapter = new TableCommentFeedbackAdapter(this);
    tableLastSyncAdapter = new TableLastSyncAdapter(this);
    tableUsersAdapter = new TableUsers(this);
  }

  @Override
  public void onCreate(SQLiteDatabase database) {
    tableCommentFeedbackAdapter.onCreate(database);
    tableLastSyncAdapter.onCreate(database);
    tableUsersAdapter.onCreate(database);
  }

  @Override
  public void onUpgrade(SQLiteDatabase database, int oldVersion, int newVersion) {
    // initial version, not need to upgrade.
    final String addColumnSql = "alter table %s add column %s %s;";
    final String updateTwoValue = "update %s set %s = %s, %s = %s;";
    final String updateOneValue = "update %s set %s = %s;";
    if (oldVersion == 1 && newVersion == 2) {
      String sql = String.format(addColumnSql,
          TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_POSITION_X, "integer");
      database.execSQL(sql);
      Log.d(TAG, "upgrade db:" + sql);
      sql = String.format(addColumnSql, TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_POSITION_Y, "integer");
      database.execSQL(sql);
      Log.d(TAG, "upgrade db:" + sql);
      sql = String.format(updateOneValue,
          TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_POSITION_X, 50,
          TableCommentFeedbackAdapter.COL_POSITION_Y, 100);
      database.execSQL(sql);
      Log.d(TAG, "upgrade db:" + sql);
    } else if (oldVersion == 2 && newVersion == 3) {
      String sql = String.format(addColumnSql,
          TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_DIRECTION, "integer");
      database.execSQL(sql);
      Log.d(TAG, "upgrade db:" + sql);
      sql = String.format(updateOneValue,
          TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_DIRECTION, 0);
      database.execSQL(sql);
      Log.d(TAG, "upgrade db:" + sql);
    } else if (oldVersion == 3 && newVersion == 4) {
      String sql = String.format(addColumnSql,
          TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_APP_VERSION, "text");
      database.execSQL(sql);
      Log.d(TAG, "upgrade db:" + sql);
      sql = String.format(addColumnSql, TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_OS_VERSION, "text");
      database.execSQL(sql);
      Log.d(TAG, "upgrade db:" + sql);
      sql = String.format(updateTwoValue,
          TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_APP_VERSION, "1.0",
          TableCommentFeedbackAdapter.COL_OS_VERSION, "4.2.2");
      database.execSQL(sql);
      Log.d(TAG, "upgrade db:" + sql);
    } else if (oldVersion == 4 && newVersion == 5) {
      String sql = String.format(addColumnSql,
          TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_MOVED, "integer");
      database.execSQL(sql);
      Log.d(TAG, "upgrade db:" + sql);
      sql = String.format(updateOneValue,
          TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_MOVED, 1);
      database.execSQL(sql);
    } else if (oldVersion == 5 && newVersion == 6) {
      String sql = String.format(addColumnSql,
          TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_LEVEL, "integer");
      database.execSQL(sql);
      Log.d(TAG, "upgrade db:" + sql);
      sql = String.format(updateOneValue,
          TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_LEVEL, 1);
      database.execSQL(sql);
    } else if (oldVersion == 6 && newVersion == 7) {
      String sql = String.format(addColumnSql,
          TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_SOURCE, "text");
      database.execSQL(sql);
      Log.d(TAG, "upgrade db:" + sql);
      sql = String.format(updateOneValue,
          TableCommentFeedbackAdapter.TABLE_NAME,
          TableCommentFeedbackAdapter.COL_SOURCE, "standalone");
      database.execSQL(sql);
    }
  }

  /**
   * @return the tableCommentFeedbackAdapter
   */
  public TableAdapter getTableCommentFeedbackAdapter() {
    return tableCommentFeedbackAdapter;
  }

  public TableAdapter getTableLastSyncAdapter() {
    return tableLastSyncAdapter;
  }

  public TableAdapter getTableUsersAdapter() {
    return tableUsersAdapter;
  }

  /**
   * Close database connection.
   */
  public void close() {
    if (getWritableDatabase().isOpen()) {
      getWritableDatabase().close();
    }
  }

}
