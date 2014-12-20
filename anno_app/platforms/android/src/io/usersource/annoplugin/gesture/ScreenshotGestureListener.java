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
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.concurrent.ExecutionException;

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
import android.os.AsyncTask;
import android.os.Environment;
import android.util.Log;

/**
 * Screenshot gesture listener, this class will detect and process spiral
 * gesture. if spiral gesture detected, will take screenshot then launch
 * AnnoDrawActivity
 * 
 * @author topcircler
 * 
 */
public class ScreenshotGestureListener implements OnGesturePerformedListener {

	public static final String TAG = "ScreenshotGestureListener";

	private static final String FEEDBACK_ACTIVITY = "io.usersource.anno.AnnoDrawActivity";
	private static final String GESTURE_NAME_PATTERN = "UserSource spiral[0-9]";
	private static final String SCREENSHOTS_DIR_NAME = "Screenshots";
	public static final String TAKE_SCREENSHOT_FAIL_MESSAGE = "Take Screenshot Failed.";

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
			if (AnnoUtils.debugEnabled) {
				Log.d(TAG, "Already 2 levels, no recursive any more.");
			}
			return;
		}

		ArrayList<Prediction> predictions = gestureLibrary.recognize(gesture);
		if (predictions != null) {
			for (Prediction prediction : predictions) {
				if (prediction.name.matches(GESTURE_NAME_PATTERN)) {
					if (prediction.score > 1) {
						String screenshotPath;
						screenshotPath = takeScreenshot(activity);
						launchAnnoPlugin(activity, screenshotPath);
						break;
					}
				}
			}
		}
	}

	public static void launchAnnoPlugin(Activity activity, String screenshotPath) {
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

	public static String takeScreenshot(Activity activity) {
		Bitmap screenshotBitmap = AnnoUtils.takeScreenshot(activity);
		String screenshotPath = null;
		try {
			screenshotPath = new AnnoUtils().new BitmapSaveWorker(screenshotBitmap).execute().get();
		} catch (InterruptedException e) {
			e.printStackTrace();
			AnnoUtils.displayError(activity, TAKE_SCREENSHOT_FAIL_MESSAGE);
		} catch (ExecutionException e) {
			e.printStackTrace();
			AnnoUtils.displayError(activity, TAKE_SCREENSHOT_FAIL_MESSAGE);
		}
		return screenshotPath;
	}	
}
