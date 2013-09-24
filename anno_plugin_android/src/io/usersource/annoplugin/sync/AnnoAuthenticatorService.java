package io.usersource.annoplugin.sync;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;

public class AnnoAuthenticatorService extends Service {

	private AnnoAuthenticator mAuthenticator;
	
	public AnnoAuthenticatorService() {
	}
	
	@Override
	public void onCreate()
	{
		mAuthenticator = new AnnoAuthenticator(this);
	}

	@Override
	public IBinder onBind(Intent arg0) {
		return mAuthenticator.getIBinder();
	}

}
