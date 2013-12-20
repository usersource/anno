/**
 * 
 */
package io.usersource.annoplugin.gesture;

import io.usersource.anno.*;
import io.usersource.annoplugin.utils.AnnoUtils;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;

import android.app.Activity;
import android.content.Intent;
import android.gesture.Gesture;
import android.gesture.GestureLibraries;
import android.gesture.GestureLibrary;
import android.gesture.GestureOverlayView;
import android.gesture.GestureOverlayView.OnGesturePerformedListener;
import android.gesture.Prediction;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Environment;
import android.util.Log;

/**
 * Screenshot gesture listener, detect and process spiral gesture.
 * 
 * @author topcircler
 * 
 */
public class ScreenshotGestureListener implements OnGesturePerformedListener {

  private static final String TAG = "ScreenshotGestureListener";

  private static final String FEEDBACK_ACTIVITY = "io.usersource.anno.AnnoDrawActivity";
  private static final String GESTURE_NAME_PATTERN = "UserSource spiral[0-9]";
  private static final String SCREENSHOTS_DIR_NAME = "Screenshots";
  private static final String TAKE_SCREENSHOT_FAIL_MESSAGE = "Take Screenshot Failed.";

  private Activity activity;
  private GestureLibrary gestureLibrary = null;

  public ScreenshotGestureListener(Activity activity) {
    this.activity = activity;

    int resourceId = activity.getResources().getIdentifier("raw/gestures", "raw", activity.getApplicationInfo().packageName);
    gestureLibrary = GestureLibraries.fromRawResource(activity, resourceId);
    gestureLibrary.load();
  }

  /*
   * (non-Javadoc)
   * 
   * @see android.gesture.GestureOverlayView.OnGesturePerformedListener#
   * onGesturePerformed(android.gesture.GestureOverlayView,
   * android.gesture.Gesture)
   */
  @Override
  public void onGesturePerformed(GestureOverlayView arg0, Gesture gesture) {
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
      Log.d(TAG, "Already 2 levels, no recursive any more.");
      return;
    }

    ArrayList<Prediction> predictions = gestureLibrary.recognize(gesture);
    if (predictions != null) {
      for (Prediction prediction : predictions) {
        if (prediction.name.matches(GESTURE_NAME_PATTERN)) {
          if (prediction.score > 1) {
            String screenshotPath;
            try {
              screenshotPath = takeScreenshot();
              launchAnnoPlugin(screenshotPath);
            } catch (FileNotFoundException e) {
              Log.e(TAG, e.getMessage(), e);
              AnnoUtils.displayError(activity, TAKE_SCREENSHOT_FAIL_MESSAGE);
            } catch (IOException e) {
              Log.e(TAG, e.getMessage());
              AnnoUtils.displayError(activity, TAKE_SCREENSHOT_FAIL_MESSAGE);
            }
            break;
          }
        }
      }
    }
  }

  private void launchAnnoPlugin(String screenshotPath) {
    String packageName = activity.getPackageName();

    Intent intent = new Intent(Intent.ACTION_SEND);
    intent.setClassName(packageName, FEEDBACK_ACTIVITY);
    intent.setType("image/*");
    File imageFile = new File(screenshotPath);
    Uri imageUri = Uri.parse("file://" + imageFile.getPath());
    intent.putExtra(Intent.EXTRA_STREAM, imageUri);

    if (activity instanceof AnnoDrawActivity
        || activity instanceof CommunityActivity
        || activity instanceof OptionFeedbackActivity
        || activity instanceof IntroActivity) {
      // current app is standalone anno, or anno plugin activity.
      intent.putExtra(AnnoUtils.LEVEL, 1);
    } else {
      // current app is 3rd.
      intent.putExtra(AnnoUtils.LEVEL, 0);
    }

    activity.startActivity(intent);
  }

  private String takeScreenshot() throws IOException {
    Bitmap b = AnnoUtils.takeScreenshot(activity);
    FileOutputStream fos = null;
    try {
      File screenshotDir = new File(
          Environment
              .getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
          SCREENSHOTS_DIR_NAME);
      if (!screenshotDir.exists()) {
        if (!screenshotDir.mkdirs()) {
          throw new IOException("Failed to create directory "
              + screenshotDir.getAbsolutePath());
        }
      }
      File screenshotPath = new File(screenshotDir,
              AnnoUtils.generateScreenshotName());
      fos = new FileOutputStream(screenshotPath);
      b.compress(Bitmap.CompressFormat.PNG, 100, fos);
      return screenshotPath.getAbsolutePath();
    } catch (FileNotFoundException e) {
      throw e;
    } finally {
      if (fos != null) {
        try {
          fos.flush();
          fos.close();
        } catch (IOException e) {
        }
      }
    }
  }
}
