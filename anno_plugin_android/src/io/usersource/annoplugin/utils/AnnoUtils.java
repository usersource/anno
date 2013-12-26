package io.usersource.annoplugin.utils;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.gesture.GestureOverlayView;
import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.drawable.BitmapDrawable;
import android.os.Environment;
import android.text.format.DateFormat;
import android.view.View;
import io.usersource.annoplugin.gesture.ScreenshotGestureListener;

import java.io.File;
import java.io.IOException;
import java.util.Calendar;

/**
 * Anno Util class
 */
public class AnnoUtils
{
  // if image size exceeds this threshold, anno will compress and send to
  // server.
  public static final String ANNO_SOURCE_PLUGIN = "plugin";
  public static final String ANNO_SOURCE_STANDALONE = "standalone";


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
   * Enable taking screenshot by certain gesture.
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
}
