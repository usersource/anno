package io.usersource.annoplugin.utils;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentUris;
import android.content.Context;
import android.content.DialogInterface;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.database.Cursor;
import android.gesture.GestureOverlayView;
import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.drawable.BitmapDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.text.format.DateFormat;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import io.usersource.anno.AnnoDrawActivity;
import io.usersource.anno.CommunityActivity;
import io.usersource.anno.IntroActivity;
import io.usersource.anno.OptionFeedbackActivity;
import io.usersource.annoplugin.gesture.ScreenshotGestureListener;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Calendar;
import java.util.UUID;

/**
 * Anno Util class
 */
public class AnnoUtils
{
  // if image size exceeds this threshold, anno will compress and send to
  // server.
  public static final String TAG = "AnnoUtils";
  public static final String ANNO_SOURCE_PLUGIN = "plugin";
  public static final String ANNO_SOURCE_STANDALONE = "standalone";
  public static final boolean debugEnabled = true;

  /**
   * Intent extra value: is_practice.
   */
  public static final String INTENT_EXTRA_IS_PRACTICE = "is_practice";

  /**
   * App name for anno sent from standalone.
   */
  public static final String UNKNOWN_APP_NAME = "Unknown";

  public static final String SCREENSHOT_TIME_FORMAT = "yyyy-MM-dd-kk-mm-ss";
  public static final String PNG_SUFFIX = ".png";
  public static final String LEVEL = "level";
  public static final String EDIT_ANNO_MODE = "edit_anno_mode";
  public static final String FAIL_CREATE_DIRECTORY = "Create directory %s failed.";
  public static final String ERROR_TITILE = "Error";


  private static String dataLocation = new File(Environment.getExternalStorageDirectory(), "Anno").getAbsolutePath();
  private static String screenshotDirName = "screenshot";

  /**
   * This constant should be kept consistently with package name in Anno
   * standalone app.
   */
  private static final String ANNO_PACKAGE_NAME = "io.usersource.anno";



  /**
   * Image Orientation constants - portrait.
   */
  public static final String IMAGE_ORIENTATION_PORTRAIT = "portrait";
  /**
   * Image Orientation constants - landscape.
   */
  public static final String IMAGE_ORIENTATION_LANDSCAPE = "landscape";

  /**
   * Enable taking screenshot by certain gesture.
   *
   * @param activity
   * @param gestureViewId
   */
  public static void setEnableGesture(Activity activity, int gestureViewId,
                                      boolean enabled) {
    if (activity != null) {
      GestureOverlayView gestureOverlayView = (GestureOverlayView) activity
              .findViewById(gestureViewId);
      setEnableGesture(activity, gestureOverlayView, enabled);
    }
  }

  /**
   * Enable taking screenshot by spiral gesture.
   *
   * @param activity
   * @param gestureOverlayView
   */
  public static void setEnableGesture(Activity activity,
                                      GestureOverlayView gestureOverlayView, boolean enabled) {
    if (activity != null) {
      if (enabled) {
        gestureOverlayView.setGestureVisible(false);
        ScreenshotGestureListener gesturePerformedListener = new ScreenshotGestureListener(activity);
        gestureOverlayView.addOnGesturePerformedListener(gesturePerformedListener);
      } else {
        gestureOverlayView.removeAllOnGesturePerformedListeners();
      }
    }
  }

  /**
   * Determine if the image orientation is landscape or portrait.
   *
   * @param drawable
   * @return IMAGE_ORIENTATION_PORTRAIT or IMAGE_ORIENTATION_LANDSCAPE.
   */
  public static String isLandscapeOrPortrait(BitmapDrawable drawable) {
    int width = drawable.getBitmap().getWidth();
    int height = drawable.getBitmap().getHeight();
    if (width > height) {
      return IMAGE_ORIENTATION_LANDSCAPE;
    } else {
      return IMAGE_ORIENTATION_PORTRAIT;
    }
  }

  /**
   * Rotate the image.
   *
   * @param drawable
   */
  public static BitmapDrawable rotateImage(BitmapDrawable drawable, int degree) {
    Bitmap bitmap = drawable.getBitmap();

    Matrix matrix = new Matrix();
    matrix.postRotate(degree);
    Bitmap rotatedBMP = Bitmap.createBitmap(drawable.getBitmap(), 0, 0,
            bitmap.getWidth(), bitmap.getHeight(), matrix, true);
    return new BitmapDrawable(rotatedBMP);
  }

  /**
   * Check if current app is standalone anno.
   *
   * @param packageName
   *          current app package name.
   * @return if current app is standalone anno.
   */
  public static boolean isAnno(String packageName) {
    return ANNO_PACKAGE_NAME.equals(packageName);
  }

  /**
   * Take screenshot without status bar.
   *
   * @param activity
   * @return screenshot bitmap.
   */
  public static Bitmap takeScreenshot(Activity activity) {
    View view = activity.getWindow().getDecorView();
    view.setDrawingCacheEnabled(true);
    view.buildDrawingCache();
    Bitmap bitmap = view.getDrawingCache();
    Rect rect = new Rect();
    activity.getWindow().getDecorView().getWindowVisibleDisplayFrame(rect);
    int statusBarHeight = rect.top;

    int width = activity.getWindowManager().getDefaultDisplay().getWidth();
    int height = activity.getWindowManager().getDefaultDisplay().getHeight();

    Bitmap bitmap2 = Bitmap.createBitmap(bitmap, 0, statusBarHeight, width,
            height - statusBarHeight);
    view.destroyDrawingCache();
    return bitmap2;
  }

  /**
   * Generate screenshot file name.
   *
   * @return screenshot file name.
   */
  public static String generateScreenshotName() {
    return "Screenshot_"
            + DateFormat.format(SCREENSHOT_TIME_FORMAT, Calendar.getInstance())
            + PNG_SUFFIX;
  }

  /**
   * Make directories. If directory exists, do nothing.
   *
   * @param context
   * @param path
   *          directory path to create.
   * @throws java.io.IOException
   *           if directory doesn't exist and fail to create.
   */
  public static void mkdirs(Context context, String path) throws IOException
  {
    Resources res = context.getResources();
    File pathFile = new File(path);
    if (!pathFile.exists()) {
      if (!pathFile.mkdirs()) {
        throw new IOException(String.format(FAIL_CREATE_DIRECTORY, pathFile.getAbsolutePath()));
      }
    }
  }

  /**
   * Get application name.
   *
   * @param activity
   *          current activity.
   * @return application name. This equals to the app title that appears in
   *         settings->application.
   * @throws android.content.pm.PackageManager.NameNotFoundException
   */
  public static String getAppName(Activity activity)
          throws PackageManager.NameNotFoundException
  {
    PackageManager pm = activity.getPackageManager();
    ApplicationInfo appInfo = pm.getApplicationInfo(activity.getPackageName(),
            0);
    return pm.getApplicationLabel(appInfo).toString();
  }

  /**
   * Get application version.
   *
   * @param activity
   *          current activity.
   * @return application version. This equals to the version that appears in
   *         settings->application.
   * @throws android.content.pm.PackageManager.NameNotFoundException
   */
  public static String getAppVersion(Activity activity)
          throws PackageManager.NameNotFoundException
  {
    PackageManager pm = activity.getPackageManager();
    PackageInfo pi = pm.getPackageInfo(activity.getPackageName(), 0);
    return pi.versionName;
  }

  /**
   * Display error.
   *
   * This is the universal entry of displaying errors. Just need to change this
   * implementation if you want to change the way to display information.
   *
   * @param message
   *          message string.
   */
  public static void displayError(Context context, String message) {
    DialogInterface.OnClickListener listener = new DialogInterface.OnClickListener() {

      public void onClick(DialogInterface dialog, int which) {
        dialog.dismiss();
      }
    };

    new AlertDialog.Builder(context).setTitle(ERROR_TITILE)
            .setMessage(message).setNeutralButton(android.R.string.ok, listener)
            .show();
  }

  /**
   * @return the dataLocation
   */
  public static String getDataLocation() {
    return dataLocation;
  }

  /**
   * @return the screenshotDirName
   */
  public static String getScreenshotDirName() {
    return screenshotDirName;
  }

  /**
   * getContentView from an activity
   * @param activity
   * @return View
   */
  public static View getContentView(Activity activity)
  {
    ViewGroup view = (ViewGroup)activity.getWindow().getDecorView();
    ViewGroup content = (ViewGroup)view.findViewById(android.R.id.content);
    return content.getChildAt(0);
  }

  /**
   * add GestureOverlayView to an activity
   * @param activity
   * @return added GestureOverlayView
   */
  public static GestureOverlayView addGestureViewToActivity(Activity activity)
  {
    View contentView = getContentView(activity);
    GestureOverlayView view = new GestureOverlayView(activity);
    view.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.MATCH_PARENT, 1));

    activity.setContentView(view);
    view.addView(contentView); // adds the PhoneGap browser
    view.getChildAt(0).setLayoutParams(
            new FrameLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT, 1));

    activity.setContentView(view);
    view.setGestureVisible(false);

    return view;
  }

  /**
   * trigger Create Anno, take screenshot and launch AnnoDrawActivity
   * it can be called by JavaScript gesture listener or native calls from host app
   * @param activity, source activity
   */
  public static void triggerCreateAnno(Activity activity)
  {
    int level = 0;
    if (activity instanceof CommunityActivity) {
      level = ((CommunityActivity) activity).getLevel();
    } else if (activity instanceof OptionFeedbackActivity) {
      level = ((OptionFeedbackActivity) activity).getLevel();
    } else if (activity instanceof IntroActivity) {
      level = ((IntroActivity) activity).getLevel();
    } else if (activity instanceof AnnoDrawActivity) {
      level = ((AnnoDrawActivity) activity).getLevel();
    }

    if (level >= 2) {
      if (debugEnabled) {
        Log.d(TAG, "Already 2 levels, no recursive any more.");
      }
      return;
    }

    try {
      String screenshotPath = ScreenshotGestureListener.takeScreenshot(activity);
      ScreenshotGestureListener.launchAnnoPlugin(activity, screenshotPath);
    } catch (FileNotFoundException e) {
      if (AnnoUtils.debugEnabled) {
        Log.e(ScreenshotGestureListener.TAG, e.getMessage(), e);
      }
      AnnoUtils.displayError(activity, ScreenshotGestureListener.TAKE_SCREENSHOT_FAIL_MESSAGE);
    } catch (IOException e) {
      if (AnnoUtils.debugEnabled) {
        Log.e(ScreenshotGestureListener.TAG, e.getMessage());
      }
      AnnoUtils.displayError(activity, ScreenshotGestureListener.TAKE_SCREENSHOT_FAIL_MESSAGE);
    }
  }


  /**
   * Get a file path from a Uri. This will get the the path for Storage Access
   * Framework Documents, as well as the _data field for the MediaStore and
   * other file-based ContentProviders.
   *
   * @param context The context.
   * @param uri The Uri to query.
   * @author paulburke
   */
  public static String getFilePathByURI(final Context context, final Uri uri) {

    final boolean isKitKat = Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT;

    // DocumentProvider
    if (isKitKat && DocumentsContract.isDocumentUri(context, uri)) {
      // ExternalStorageProvider
      if (isExternalStorageDocument(uri)) {
        final String docId = DocumentsContract.getDocumentId(uri);
        final String[] split = docId.split(":");
        final String type = split[0];

        if ("primary".equalsIgnoreCase(type)) {
          return Environment.getExternalStorageDirectory() + "/" + split[1];
        }

        // TODO handle non-primary volumes
      }
      // DownloadsProvider
      else if (isDownloadsDocument(uri)) {

        final String id = DocumentsContract.getDocumentId(uri);
        final Uri contentUri = ContentUris.withAppendedId(
                Uri.parse("content://downloads/public_downloads"), Long.valueOf(id));

        return getDataColumn(context, contentUri, null, null);
      }
      // MediaProvider
      else if (isMediaDocument(uri)) {
        final String docId = DocumentsContract.getDocumentId(uri);
        final String[] split = docId.split(":");
        final String type = split[0];

        Uri contentUri = null;
        if ("image".equals(type)) {
          contentUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
        } else if ("video".equals(type)) {
          contentUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
        } else if ("audio".equals(type)) {
          contentUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
        }

        final String selection = "_id=?";
        final String[] selectionArgs = new String[] {
                split[1]
        };

        return getDataColumn(context, contentUri, selection, selectionArgs);
      }
    }
    // MediaStore (and general)
    else if ("content".equalsIgnoreCase(uri.getScheme())) {
      return getDataColumn(context, uri, null, null);
    }
    // File
    else if ("file".equalsIgnoreCase(uri.getScheme())) {
      return uri.getPath();
    }

    return null;
  }

  /**
   * Get the value of the data column for this Uri. This is useful for
   * MediaStore Uris, and other file-based ContentProviders.
   *
   * @param context The context.
   * @param uri The Uri to query.
   * @param selection (Optional) Filter used in the query.
   * @param selectionArgs (Optional) Selection arguments used in the query.
   * @return The value of the _data column, which is typically a file path.
   */
  private static String getDataColumn(Context context, Uri uri, String selection,
                                     String[] selectionArgs) {

    Cursor cursor = null;
    final String column = "_data";
    final String[] projection = {
            column
    };

    try {
      cursor = context.getContentResolver().query(uri, projection, selection, selectionArgs,
              null);
      if (cursor != null && cursor.moveToFirst()) {
        final int column_index = cursor.getColumnIndexOrThrow(column);
        return cursor.getString(column_index);
      }
    } finally {
      if (cursor != null)
        cursor.close();
    }
    return null;
  }


  /**
   * @param uri The Uri to check.
   * @return Whether the Uri authority is ExternalStorageProvider.
   */
  private static boolean isExternalStorageDocument(Uri uri) {
    return "com.android.externalstorage.documents".equals(uri.getAuthority());
  }

  /**
   * @param uri The Uri to check.
   * @return Whether the Uri authority is DownloadsProvider.
   */
  private static boolean isDownloadsDocument(Uri uri) {
    return "com.android.providers.downloads.documents".equals(uri.getAuthority());
  }

  /**
   * @param uri The Uri to check.
   * @return Whether the Uri authority is MediaProvider.
   */
  private static boolean isMediaDocument(Uri uri) {
    return "com.android.providers.media.documents".equals(uri.getAuthority());
  }

  /**
   * generate Unique Image Key
   * @return String
   */
  public static String generateUniqueImageKey()
  {
    return UUID.randomUUID().toString();
  }
}
