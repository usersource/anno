package io.usersource.annoplugin.shake;

import io.usersource.annoplugin.AnnoSingleton;
import io.usersource.annoplugin.utils.AnnoUtils;

import java.util.concurrent.ExecutionException;

import android.content.Context;
import android.hardware.SensorManager;
import android.util.Log;

public class ShakeActivitySession implements ShakeListener {
	private static ShakeActivitySession shakeActivitySession = null;
	private ShakeDetector shakeDetector;
	private SensorManager sensorManager;
	Context context;

	public ShakeActivitySession() {
		shakeDetector = new ShakeDetector(this);
		context = AnnoSingleton.appContext;
	}
	
	public static ShakeActivitySession getInstance() {
		if (shakeActivitySession == null) {
			shakeActivitySession = new ShakeActivitySession();
		}
		return shakeActivitySession;
	}

	@Override
	public void onDeviceShaked() throws InterruptedException, ExecutionException {
//		AnnoUtils.triggerCreateAnno(AnnoSingleton.appActivity);
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
		Log.d("AnnoSingleton", "shake detected");
		AnnoSingleton.getInstance(null).showCommunityPage(AnnoSingleton.appActivity);
	}
}
