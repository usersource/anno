package io.usersource.annoplugin;

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
}