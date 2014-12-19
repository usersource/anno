package io.usersource.annoplugin.shake;

import io.usersource.annoplugin.AnnoSingleton;
import io.usersource.annoplugin.gesture.ScreenshotGestureListener;

import java.io.IOException;
import java.util.concurrent.ExecutionException;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.hardware.SensorManager;
import android.util.Log;

public class ShakeActivitySession implements ShakeListener {
	private static ShakeActivitySession shakeActivitySession = null;
	public static String screenshotPath;
	public static Boolean shakeMenuVisible = false;
	private ShakeDetector shakeDetector;
	private SensorManager sensorManager;
	Context context;
	Activity activity;

	Integer lastShakeTime, shakeValue;

	public ShakeActivitySession() {
		shakeDetector = new ShakeDetector(this);
		context = AnnoSingleton.appContext;
		activity = AnnoSingleton.appActivity;
		lastShakeTime = 0;
		shakeValue = 0;
	}
	
	public static ShakeActivitySession getInstance() {
		if (shakeActivitySession == null) {
			shakeActivitySession = new ShakeActivitySession();
		}
		return shakeActivitySession;
	}

	@Override
	public void onDeviceShaked() throws InterruptedException, ExecutionException {
		Log.d(AnnoSingleton.TAG, "shake detected");
		if (!AnnoSingleton.allowShake) return;
		if (shakeMenuVisible || AnnoSingleton.annot8Visible) return;

		if (lastShakeTime != 0) {
			Integer timeDiff = (int) (System.currentTimeMillis() - lastShakeTime);
			if (timeDiff > 10000) {
				shakeValue = 0;
				lastShakeTime = 0;
				return;
			}
		}

		lastShakeTime = (int) System.currentTimeMillis();
		shakeValue += 1;
		if (shakeValue != (AnnoSingleton.shakeValue + 1)) return;

		try {
			screenshotPath = ScreenshotGestureListener.takeScreenshot(activity);
			Intent intent = new Intent(activity, ShakeMenu.class);
			activity.startActivity(intent);
			shakeMenuVisible = true;
			lastShakeTime = 0;
			shakeValue = 0;
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void startShakeListening() {
		sensorManager = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
		shakeDetector.start(sensorManager);
	}

	@Override
	public void stopShakeListening() {
		context = null;
		shakeDetector.stop();
	}
}
