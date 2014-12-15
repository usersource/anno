package io.usersource.annoplugin;

import android.util.Log;

public class AnnoSingleton {
	private static AnnoSingleton instance = null;

	String email, displayName, userImageURL, teamKey, teamSecret;

	protected AnnoSingleton() {
		// Exists only to defeat instantiation.
	}

	public static AnnoSingleton getInstance() {
		if (instance == null) {
			instance = new AnnoSingleton();
		}
		return instance;
	}

	public void setupWithUserInfo(String emailValue, String displayName,
			String userImageURL, String teamKey, String teamSecret) {
		this.email = emailValue;
		Log.e("AnnoSingleton", this.email);
	}
}