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

	public ShakeActivitySession() {
		shakeDetector = new ShakeDetector(this);
		context = AnnoSingleton.appContext;
		activity = AnnoSingleton.appActivity;
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
		if (shakeMenuVisible || AnnoSingleton.annot8Visible) return;

		try {
			screenshotPath = ScreenshotGestureListener.takeScreenshot(activity);
			Intent intent = new Intent(activity, ShakeMenu.class);
			activity.startActivity(intent);
			shakeMenuVisible = true;
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
