/**
 * 
 */
package io.usersource.annoplugin.gesture;

import io.usersource.annoplugin.R;
import io.usersource.annoplugin.utils.PluginUtils;
import io.usersource.annoplugin.utils.ScreenshotUtils;
import io.usersource.annoplugin.utils.ViewUtils;
import io.usersource.annoplugin.view.AnnoMainActivity;
import io.usersource.annoplugin.view.CommunityActivity;
import io.usersource.annoplugin.view.FeedbackEditActivity;
import io.usersource.annoplugin.view.FeedbackViewActivity;

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

  private static final String FEEDBACK_ACTIVITY = "io.usersource.annoplugin.view.FeedbackEditActivity";
  private static final String GESTURE_NAME = "UserSource spiral";
  private static final String SCREENSHOTS_DIR_NAME = "Screenshots";

  private Activity activity;
  private GestureLibrary gestureLibrary = null;

  public ScreenshotGestureListener(Activity activity, int rawResourceId) {
    this.activity = activity;
    gestureLibrary = GestureLibraries.fromRawResource(activity, rawResourceId);
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
    if (activity instanceof FeedbackEditActivity) {
      level = ((FeedbackEditActivity) activity).getLevel();
    } else if (activity instanceof FeedbackViewActivity) {
      level = ((FeedbackViewActivity) activity).getLevel();
    } else if (activity instanceof AnnoMainActivity) {
      level = ((AnnoMainActivity) activity).getLevel();
    } else if (activity instanceof CommunityActivity) {
      level = ((CommunityActivity) activity).getLevel();
    }

    if (level >= 2) {
      Log.d(TAG, "Already 2 levels, no recursive any more.");
      return;
    }

    ArrayList<Prediction> predictions = gestureLibrary.recognize(gesture);
    ArrayList<String> predictionNames = new ArrayList<String>();
    if (predictions != null) {
      for (Prediction prediction : predictions) {
        predictionNames.add(prediction.name);
      }
      if (predictionNames.contains(GESTURE_NAME)) {
        String screenshotPath;
        try {
          screenshotPath = takeScreenshot();
          launchAnnoPlugin(screenshotPath);
        } catch (FileNotFoundException e) {
          Log.e(TAG, e.getMessage(), e);
          ViewUtils.displayError(activity, R.string.fail_take_screenshot);
        } catch (IOException e) {
          Log.e(TAG, e.getMessage());
          ViewUtils.displayError(activity, R.string.fail_take_screenshot);
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

    if (activity instanceof FeedbackEditActivity
        || activity instanceof FeedbackViewActivity
        || activity instanceof AnnoMainActivity
        || activity instanceof CommunityActivity) {
      // current app is standalone anno, or anno plugin activity.
      intent.putExtra(PluginUtils.LEVEL, 1);
    } else {
      // current app is 3rd.
      intent.putExtra(PluginUtils.LEVEL, 0);
    }

    activity.startActivity(intent);
  }

  private String takeScreenshot() throws IOException {
    Bitmap b = ScreenshotUtils.takeScreenshot(activity);
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
          ScreenshotUtils.generateScreenshotName());
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
