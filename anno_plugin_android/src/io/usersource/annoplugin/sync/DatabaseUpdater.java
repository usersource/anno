package io.usersource.annoplugin.sync;

import io.usersource.annoplugin.datastore.AnnoSQLiteOpenHelper;
import io.usersource.annoplugin.datastore.TableAdapter;
import io.usersource.annoplugin.datastore.TableCommentFeedbackAdapter;
import io.usersource.annoplugin.datastore.TableLastSyncAdapter;
import io.usersource.annoplugin.model.AnnoContentProvider;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.util.Log;

public class DatabaseUpdater {

  private final String TAG = "DatabaseUpdater";
  private ContentResolver dbContext;
  private AnnoSQLiteOpenHelper annoSQLiteOpenHelper;

  public DatabaseUpdater(Context context) {
    dbContext = context.getContentResolver();
    annoSQLiteOpenHelper = new AnnoSQLiteOpenHelper(context);
  }

  public Long getLastSyncTime() {
    TableAdapter lastSyncAdapter = annoSQLiteOpenHelper
        .getTableLastSyncAdapter();
    String[] projection = { TableLastSyncAdapter.COL_LAST_SYNC_TIME };
    Cursor cursor = lastSyncAdapter.query(projection, null, null, null);
    Long time = null;
    if (cursor != null && cursor.moveToFirst()) {
      time = cursor.getLong(0);
    }
    if (cursor != null) {
      if (!cursor.isClosed()) {
        cursor.close();
      }
      cursor = null;
    }
    return time;
  }

  public void updateLastSyncTime(Long time) {
    TableAdapter lastSyncAdapter = annoSQLiteOpenHelper
        .getTableLastSyncAdapter();
    ContentValues values = new ContentValues();
    values.put(TableLastSyncAdapter.COL_LAST_SYNC_TIME, time);
    int rows = lastSyncAdapter.update(values, null, null);
    Log.d(TAG, "last_sync_time:" + rows + " rows is updated.");
  }

  public void setRecordKey(String recordId, String key) {
    Uri updateUri = Uri.parse(AnnoContentProvider.COMMENT_PATH_URI.toString()
        + "/" + recordId);
    ContentValues values = new ContentValues();
    values.put(TableCommentFeedbackAdapter.COL_OBJECT_KEY, key);
    int count = dbContext.update(updateUri, values, null, null);

    if (count <= 0) {
      Log.v(TAG, "Can't add key for record id = " + recordId);
    }
  }

  public Cursor getItemsAfterDate(Long timeMillis) {
    String selection = null;
    if (null != timeMillis) {
      selection = TableCommentFeedbackAdapter.COL_TIMESTAMP + " > "
          + timeMillis + " ";
    }
    Cursor result = dbContext.query(AnnoContentProvider.COMMENT_PATH_URI, null,
        selection, null, null);
    return result;
  }
  
   
  public void createNewRecord(ContentValues record) {
    if (dbContext.insert(AnnoContentProvider.COMMENT_PATH_URI, record) == null) {
      Log.v(TAG, "Can't insert a new item" + record.toString());
    }
  }

}
