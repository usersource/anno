package io.usersource.annoplugin.shake;

import java.util.concurrent.ExecutionException;

import android.content.Context;

public interface ShakeListener {
	void onDeviceShaked() throws InterruptedException, ExecutionException;

	void startShakeListening(Context context);

	void stopShakeListening(Context context);
}