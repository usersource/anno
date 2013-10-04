/**
 *
 */
package io.usersource.annoplugin;

import io.usersource.annoplugin.gesture.ScreenshotGestureListener;
import android.app.Activity;
import android.gesture.GestureOverlayView;

/**
 * Anno plugin entry.
 * 
 * @author topcircler
 */
public class AnnoPlugin {

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
        ScreenshotGestureListener gesturePerformedListener = new ScreenshotGestureListener(
            activity, R.raw.gestures);
        gestureOverlayView
            .addOnGesturePerformedListener(gesturePerformedListener);
      } else {
        gestureOverlayView.removeAllOnGesturePerformedListeners();
      }
    }
  }

}
