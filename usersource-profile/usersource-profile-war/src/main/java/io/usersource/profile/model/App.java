package io.usersource.profile.model;

public class App {

	private String appName;
	private String appVersion;
	private byte[] appIcon;

	public App() {

	}

	public App(String appName, String appVersion) {
		super();
		this.appName = appName;
		this.appVersion = appVersion;
	}

	public String getAppName() {
		return appName;
	}

	public void setAppName(String appName) {
		this.appName = appName;
	}

	public String getAppVersion() {
		return appVersion;
	}

	public void setAppVersion(String appVersion) {
		this.appVersion = appVersion;
	}

	public byte[] getAppIcon() {
		return appIcon;
	}

	public void setAppIcon(byte[] appIcon) {
		this.appIcon = appIcon;
	}

}
