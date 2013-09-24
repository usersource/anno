/**
 * 
 */
package io.usersource.annoplugin.utils;

import io.usersource.annoplugin.R;

import java.io.File;
import java.io.IOException;

import android.app.Activity;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.content.res.Resources;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Environment;
import android.os.StatFs;
import android.util.DisplayMetrics;

/**
 * System Utilities.
 * 
 * @author topcircler
 * 
 */
public final class SystemUtils {

  /**
   * Check if SD card is mounted.
   * 
   * @return if SD card is mounted.
   */
  public static boolean isSDCardMounted() {
    return Environment.MEDIA_MOUNTED.equals(Environment
        .getExternalStorageState());
  }

  /**
   * Get SD Card free spaces(bytes). If SD card isn't mounted, return -1.
   * 
   * @return SD Card free spaces(bytes)
   */
  public static long getFreeSDCardSpace() {
    if (isSDCardMounted()) {
      return getDirectorySize(Environment.getExternalStorageDirectory());
    }
    return -1;
  }

  /**
   * Get a directory size(bytes).
   * 
   * @param file
   *          directory file.
   * @return directory size(bytes).
   */
  public static long getDirectorySize(File file) {
    StatFs stat = new StatFs(file.getPath());
    long blockSize = stat.getBlockSize();
    long availableBlocks = stat.getAvailableBlocks();
    return blockSize * availableBlocks;
  }

  /**
   * Make directories. If directory exists, do nothing.
   * 
   * @param context
   * @param path
   *          directory path to create.
   * @throws IOException
   *           if directory doesn't exist and fail to create.
   */
  public static void mkdirs(Context context, String path) throws IOException {
    Resources res = context.getResources();
    File pathFile = new File(path);
    if (!pathFile.exists()) {
      if (!pathFile.mkdirs()) {
        throw new IOException(res.getString(R.string.fail_create_directory,
            pathFile.getAbsolutePath()));
      }
    }
  }

  /**
   * get screen resolution.
   * 
   * @param activity
   * @return resolution array.
   */
  public static int[] resolution(Activity activity) {
    DisplayMetrics displayMetrics = new DisplayMetrics();
    activity.getWindowManager().getDefaultDisplay().getMetrics(displayMetrics);
    return new int[] { displayMetrics.widthPixels, displayMetrics.heightPixels };
  }

  /**
   * Get application name.
   * 
   * @param activity
   *          current activity.
   * @return application name. This equals to the app title that appears in
   *         settings->application.
   * @throws NameNotFoundException
   */
  public static String getAppName(Activity activity)
      throws NameNotFoundException {
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
   * @throws NameNotFoundException
   */
  public static String getAppVersion(Activity activity)
      throws NameNotFoundException {
    PackageManager pm = activity.getPackageManager();
    PackageInfo pi = pm.getPackageInfo(activity.getPackageName(), 0);
    return pi.versionName;
  }

  /**
   * Get phone/tablet model. For example, I use Nexus 7, it should return 'Nexus
   * 7'.
   * 
   * @return phone/tablet model.
   */
  public static String getModel() {
    return android.os.Build.MODEL;
  }

  /**
   * Get android os version.
   * 
   * @return android os version.
   */
  public static String getOSVersion() {
    return android.os.Build.VERSION.RELEASE;
  }

  /**
   * Checks if the devices has network connectivity.
   * 
   * @return if the devices has network connectivity.
   */
  public static boolean isOnline(Context context) {
    ConnectivityManager cm = (ConnectivityManager) context
        .getSystemService(Context.CONNECTIVITY_SERVICE);
    NetworkInfo networkInfo = cm.getActiveNetworkInfo();
    return networkInfo != null && networkInfo.isConnectedOrConnecting();
  }

  /**
   * Get the time when app was first installed.
   * 
   * @param activity
   * @return
   * @throws NameNotFoundException
   */
  public static Long getAppInstallTime(Activity activity)
      throws NameNotFoundException {
    PackageManager pm = activity.getPackageManager();
    PackageInfo pi = pm.getPackageInfo(activity.getPackageName(), 0);
    return pi.firstInstallTime;
  }

  /**
   * Get the time when app was last modified-update.
   * 
   * @param activity
   * @return
   * @throws NameNotFoundException
   */
  public static Long getAppUpdateTime(Activity activity)
      throws NameNotFoundException {
    PackageManager pm = activity.getPackageManager();
    ApplicationInfo ai = pm.getApplicationInfo(activity.getPackageName(), 0);
    File apkFile = new File(ai.sourceDir);
    return apkFile.exists() ? apkFile.lastModified() : null;
  }

  public static Long getAppLastUpdateTime(Activity activity)
      throws NameNotFoundException {
    Long updateTime = getAppUpdateTime(activity);
    if (updateTime != null) {
      return updateTime;
    }
    Long installTime = getAppInstallTime(activity);
    return installTime;
  }
}
