/**
 * 
 */
package io.usersource.annoplugin.datastore;

import java.util.List;

import android.content.ContentValues;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

/**
 * Abstract table adapter.
 * 
 * @author topcircler
 * 
 */
public abstract class AbstractTableAdapter implements TableAdapter {

  protected SQLiteOpenHelper sqliteOpenHelper;

  public AbstractTableAdapter(SQLiteOpenHelper sqliteOpenHelper) {
    this.sqliteOpenHelper = sqliteOpenHelper;
  }

  /**
   * Return the table name.
   * 
   * @return table name.
   */
  public abstract String getTableName();

  /**
   * Return table initialization sql scripts.
   * 
   * NOTICE: sql execution order is important.
   * 
   * @return init sql scripts.
   */
  public abstract List<String> getInitSqls();

  @Override
  public void onCreate(SQLiteDatabase database) {
    List<String> initSqls = getInitSqls();
    if (initSqls != null) {
      for (String sql : initSqls) {
        database.execSQL(sql);
      }
    }
  }

  @Override
  public int delete(String arg1, String[] args2) {
    throw new UnsupportedOperationException(getTableName()
        + "delete Not Implemented.");
  }

  @Override
  public int update(ContentValues values, String selection,
      String[] selectionArgs) {
    SQLiteDatabase database = this.sqliteOpenHelper.getWritableDatabase();
    return database.update(getTableName(), values, selection, selectionArgs);
  }

  @Override
  public Cursor query(String[] projection, String selection,
      String[] selectionArgs, String sortOrder) {
    Cursor cursor = null;
    SQLiteDatabase database = this.sqliteOpenHelper.getReadableDatabase();
    cursor = database.query(getTableName(), projection, selection,
        selectionArgs, null, null, sortOrder);
    return cursor;
  }

}
