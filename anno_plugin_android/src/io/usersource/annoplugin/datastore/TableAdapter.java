package io.usersource.annoplugin.datastore;

import android.content.ContentValues;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

/**
 * Classes that implement this interface provide methods which allow simplify
 * table management routines.
 * 
 * @author topcircler
 * 
 */
public interface TableAdapter {

  /**
   * 
   * @param database
   */
  void onCreate(SQLiteDatabase database);

  /**
   * 
   * @param values
   * @return
   */
  long insert(ContentValues values);

  /**
   * 
   * @param arg1
   * @param args2
   * @return
   */
  int delete(String arg1, String[] args2);

  /**
   * 
   * @param values
   * @param selection
   * @param selectionArgs
   * @return
   */
  int update(ContentValues values, String selection, String[] selectionArgs);

  /**
   * 
   * @param projection
   * @param selection
   * @param selectionArgs
   * @param sortOrder
   * @return
   */
  Cursor query(String[] projection, String selection, String[] selectionArgs,
      String sortOrder);

}
