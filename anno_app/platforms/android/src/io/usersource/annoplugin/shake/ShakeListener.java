package io.usersource.annoplugin.shake;

import java.util.concurrent.ExecutionException;

public interface ShakeListener {
	void onDeviceShaked() throws InterruptedException, ExecutionException;

	void startShakeListening();

	void stopShakeListening();
}