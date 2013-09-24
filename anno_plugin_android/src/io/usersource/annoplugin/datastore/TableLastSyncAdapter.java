package io.usersource.annoplugin.datastore;

import java.util.ArrayList;
import java.util.List;

import android.content.ContentValues;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

/**
 * Table adapter for storing last synchronization time.
 * 
 * @author topcircler
 * 
 */
public class TableLastSyncAdapter extends AbstractTableAdapter {

  public static final String COL_ID = "_id";
  public static final String COL_LAST_SYNC_TIME = "last_sync";
  public static final String TABLE_NAME = "last_sync_time";

  public TableLastSyncAdapter(SQLiteOpenHelper sqliteOpenHelper) {
    super(sqliteOpenHelper);
  }

  @Override
  public long insert(ContentValues values) {
    SQLiteDatabase database = sqliteOpenHelper.getWritableDatabase();
    return database.insert(getTableName(), null, values);
  }

  @Override
  public String getTableName() {
    return TABLE_NAME;
  }

  @Override
  public List<String> getInitSqls() {
    String createTableSql = String
        .format(
            "create table %s (%s integer primary key autoincrement, %s text not null);",
            TABLE_NAME, COL_ID, COL_LAST_SYNC_TIME);
    String initTableSql = String.format("insert into %s values(NULL, %s);",
        TABLE_NAME, System.currentTimeMillis());
    List<String> initSqls = new ArrayList<String>();
    initSqls.add(createTableSql);
    initSqls.add(initTableSql);
    return initSqls;
  }

}
