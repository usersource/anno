/**
 * 
 */
package io.usersource.annoplugin.model;

import io.usersource.annoplugin.datastore.AnnoSQLiteOpenHelper;
import io.usersource.annoplugin.datastore.TableCommentFeedbackAdapter;
import io.usersource.annoplugin.datastore.TableUsers;
import io.usersource.annoplugin.datastore.UnknownUriException;
import android.content.ContentProvider;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.UriMatcher;
import android.database.Cursor;
import android.database.SQLException;
import android.net.Uri;

/**
 * Content Provider for anno app.
 * 
 * @author topcircler
 * 
 */
public class AnnoContentProvider extends ContentProvider {

  public static final String AUTHORITY = "io.usersource.anno.provider";
  // public static final String AUTHORITY = "co.usersource.doui.provider";
  public static final String COMMENT_PATH = TableCommentFeedbackAdapter.TABLE_NAME;
  public static final String USERS_PATH = TableUsers.TABLE_NAME;

  public static final Uri COMMENT_PATH_URI = Uri.parse("content://" + AUTHORITY
      + "/" + COMMENT_PATH);
  public static final Uri USERS_PATH_URI = Uri.parse("content://" + AUTHORITY
      + "/" + USERS_PATH);

  /** code that represents operation on one comment. */
  private static final int SINGLE_COMMENT_CODE = 1;
  /** code that represents operation on all comments. */
  private static final int COMMENT_CODE = 2;

  /** code that represents operation on all users */
  private static final int USERS_CODE = 3;

  /* MIME type definitions */
  private static final String TABLE_MIME_TYPE = "vnd";
  private static final String TABLE_MIME_SUBTYPE_FOR_ROW = "android.cursor.item/";
  private static final String TABLE_MIME_SUBTYPE_FOR_ROWS = "android.cursor.dir/";
  private static final String TABLE_NAME_PROVIDER_SPECIFIC = "io.usersource.anno.provider";
  // private static final String TABLE_NAME_PROVIDER_SPECIFIC =
  // "co.usersource.doui.provider";

  private AnnoSQLiteOpenHelper annoSQLiteOpenHelper;
  private static final UriMatcher URI_MATCHER = new UriMatcher(
      UriMatcher.NO_MATCH);

  static {
    URI_MATCHER.addURI(AUTHORITY, COMMENT_PATH + "/#", SINGLE_COMMENT_CODE);
    URI_MATCHER.addURI(AUTHORITY, COMMENT_PATH, COMMENT_CODE);
    URI_MATCHER.addURI(AUTHORITY, USERS_PATH, USERS_CODE);
  }

  @Override
  public boolean onCreate() {
    annoSQLiteOpenHelper = new AnnoSQLiteOpenHelper(getContext());
    return true;
  }

  @Override
  public int delete(Uri uri, String selection, String[] selectionArgs) {
    throw new UnsupportedOperationException("Not Implemented.");
  }

  @Override
  public String getType(Uri uri) {
    int code = URI_MATCHER.match(uri);
    switch (code) {
    case SINGLE_COMMENT_CODE:
      return TABLE_MIME_TYPE + "." + TABLE_MIME_SUBTYPE_FOR_ROW + "/"
          + TABLE_NAME_PROVIDER_SPECIFIC + "." + COMMENT_PATH;
    case COMMENT_CODE:
      return TABLE_MIME_TYPE + "." + TABLE_MIME_SUBTYPE_FOR_ROWS + "/"
          + TABLE_NAME_PROVIDER_SPECIFIC + "." + COMMENT_PATH;
    default:
      handleUnknownUri(uri, code);
    }
    return null;
  }

  @Override
  public Uri insert(Uri uri, ContentValues values) {
    int code = URI_MATCHER.match(uri);
    switch (code) {
    case COMMENT_CODE:
      long newId = annoSQLiteOpenHelper.getTableCommentFeedbackAdapter()
          .insert(values);
      if (newId != -1) {
        return ContentUris.withAppendedId(COMMENT_PATH_URI, newId);
      }
      /*
       * up level api should catch this exception, and handle it themselves.
       */
      throw new SQLException(String.format("insert comment(uri:%s) failed.",
          uri.toString()));
    case USERS_CODE:
      long id = annoSQLiteOpenHelper.getTableUsersAdapter().insert(values);
      if (id != -1) {
        return ContentUris.withAppendedId(USERS_PATH_URI, id);
      }
      throw new SQLException(String.format("insert user(uri:%s) failed.",
          uri.toString()));
    default:
      handleUnknownUri(uri, code);
    }
    return null;
  }

  @Override
  public Cursor query(Uri uri, String[] projection, String selection,
      String[] selectionArgs, String sortOrder) {
    int code = URI_MATCHER.match(uri);
    switch (code) {
    case COMMENT_CODE:
      return annoSQLiteOpenHelper.getTableCommentFeedbackAdapter().query(
          projection, selection, selectionArgs, sortOrder);
    case SINGLE_COMMENT_CODE:
      String[] args = { uri.getLastPathSegment() };
      String selectionExpr = TableCommentFeedbackAdapter.COL_ID + " = ?";
      return annoSQLiteOpenHelper.getTableCommentFeedbackAdapter().query(
          projection, selectionExpr, args, sortOrder);
    case USERS_CODE:
      return annoSQLiteOpenHelper.getTableUsersAdapter().query(projection,
          selection, selectionArgs, sortOrder);
    default:
      handleUnknownUri(uri, code);
    }
    return null;
  }

  @Override
  public int update(Uri uri, ContentValues values, String selection,
      String[] selectionArgs) {
    int code = URI_MATCHER.match(uri);
    switch (code) {
    case SINGLE_COMMENT_CODE:
      String[] args = { uri.getLastPathSegment() };
      String selectionExpr = TableCommentFeedbackAdapter.COL_ID + " = ?";
      return annoSQLiteOpenHelper.getTableCommentFeedbackAdapter().update(
          values, selectionExpr, args);
    default:
      handleUnknownUri(uri, code);
    }
    return 0;
  }

  /**
   * Handle the unknown uri.
   * 
   * @param uri
   *          uri.
   * @param matchCode
   *          matched code.
   * @throws UnknownUriException
   */
  private void handleUnknownUri(Uri uri, int matchCode)
      throws UnknownUriException {
    throw new UnknownUriException(uri, matchCode, String.format(
        "Unknown uri(%s) code(%s).", uri.toString(), matchCode));
  }

}
