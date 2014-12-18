package io.usersource.annoplugin.shake;

import io.usersource.annoplugin.AnnoSingleton;
import io.usersource.annoplugin.utils.AnnoUtils;

import java.util.concurrent.ExecutionException;

import android.app.Activity;
import android.content.Context;
import android.hardware.SensorManager;
import android.util.Log;

public class ShakeActivitySession implements ShakeListener {
	private static ShakeActivitySession shakeActivitySession = null;
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
//		AnnoUtils.triggerCreateAnno(activity);
		showShakeActivityMenu();
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

	private void showShakeActivityMenu() {
		Log.d(AnnoSingleton.TAG, "shake detected");
		AnnoSingleton.getInstance(null).showCommunityPage(activity);
	}
}
