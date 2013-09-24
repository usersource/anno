/**
 * 
 */
package io.usersource.annoplugin.utils;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import android.content.Context;
import android.os.Environment;
import android.util.Log;

/**
 * Application configurations。
 * 
 * @author topcircler
 * 
 */
public final class AppConfig {

  private static final String TAG = AppConfig.class.getSimpleName();
  private static final String SETTING = "anno.settings";

  private static AppConfig instance;

  private String dataLocation;
  private String screenshotDirName;

  private AppConfig(Context context) {
    load(context, SETTING);
  }

  /**
   * TODO: add comments.
   * 
   * @param context
   * @return
   */
  public static AppConfig getInstance(Context context) {
    if (instance == null) {
      instance = new AppConfig(context);
    }
    return instance;
  }

  private void load(Context context, String path) {
    Properties prop = new Properties();
    InputStream in = null;
    try {
      in = context.getAssets().open(path);
      prop.load(in);

      dataLocation = new File(Environment.getExternalStorageDirectory(),
          prop.getProperty("data_location")).getAbsolutePath();
      screenshotDirName = prop.getProperty("screenshot_dir");
    } catch (Exception e) {
      Log.e(TAG, "Load " + path + " error.");
      Log.i(TAG, "Application will use default setting.");
      dataLocation = new File(Environment.getExternalStorageDirectory(), "Anno")
          .getAbsolutePath();
      screenshotDirName = "screenshot";
    } finally {
      if (in != null) {
        try {
          in.close();
        } catch (IOException e) {
          Log.e(TAG, e.getMessage(), e);
        }
      }
    }
    Log.i(TAG, "====Application Setting====");
    Log.i(TAG, "data_location=" + dataLocation);
    Log.i(TAG, "screenshot_dir=" + screenshotDirName);
  }

  /**
   * @return the dataLocation
   */
  public String getDataLocation() {
    return dataLocation;
  }

  /**
   * @return the screenshotDirName
   */
  public String getScreenshotDirName() {
    return screenshotDirName;
  }

}
