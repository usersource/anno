/**
 * 
 */
package io.usersource.annoplugin.utils;

import java.util.Calendar;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Rect;
import android.text.format.DateFormat;
import android.view.View;

/**
 * Screenshot utilities.
 * 
 * @author topcircler
 * 
 */
public class ScreenshotUtils {

  public static final String SCREENSHOT_TIME_FORMAT = "yyyy-MM-dd-kk-mm-ss";
  public static final String PNG_SUFFIX = ".png";

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

}
