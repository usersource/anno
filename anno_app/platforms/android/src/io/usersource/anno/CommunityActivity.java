package io.usersource.anno;

import java.io.IOException;

import io.usersource.annoplugin.utils.AnnoUtils;

import org.apache.cordova.DroidGap;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GooglePlayServicesUtil;
import com.google.android.gms.gcm.GoogleCloudMessaging;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager.NameNotFoundException;
import android.gesture.GestureOverlayView;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

/**
 * Community html5 entry activity. This activity launch html5 pages on create.
 * 
 * @author topcircler
 * 
 */
public class CommunityActivity extends DroidGap {

	private int level;

	// GCM related
	public static final String PROPERTY_REG_ID = "registration_id";
	private static final String PROPERTY_APP_VERSION = "appVersion";
	private final static int PLAY_SERVICES_RESOLUTION_REQUEST = 9000;
	static final String GCM_TAG = "GCM";

	Context applicationContext;
	GoogleCloudMessaging gcm;
	SharedPreferences prefs;
	String regid;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		super.init();

		applicationContext = this.getApplicationContext();

		/**
		 * spiral gesture support start
		 */
		GestureOverlayView view = new GestureOverlayView(this);
		view.setLayoutParams(new LinearLayout.LayoutParams(
				LinearLayout.LayoutParams.MATCH_PARENT,
				LinearLayout.LayoutParams.MATCH_PARENT, 1));

		setContentView(view);
		view.addView((View) appView.getParent()); // adds the PhoneGap browser
		view.getChildAt(0).setLayoutParams(
				new FrameLayout.LayoutParams(
						LinearLayout.LayoutParams.MATCH_PARENT,
						FrameLayout.LayoutParams.MATCH_PARENT, 1));

		setContentView(view);
		AnnoUtils.setEnableGesture(this, view, true);
		/**
		 * spiral gesture support end
		 */

		super.loadUrl("file:///android_asset/www/anno/pages/community/main.html");
		// WebView.setWebContentsDebuggingEnabled(true);
		Intent intent = getIntent();
		level = intent.getIntExtra(AnnoUtils.LEVEL, 0);

		// Check device for Play Services APK. If check succeeds, proceed with
		// GCM registration.
		if (checkPlayServices()) {
			gcm = GoogleCloudMessaging.getInstance(this);
			regid = getRegistrationId(applicationContext);

			if (regid.isEmpty()) {
				registerInBackground();
			} else {
				Log.i(GCM_TAG, "Registration ID found. Registration ID: "
						+ regid);
			}
		} else {
			Log.i(GCM_TAG, "No valid Google Play Services APK found.");
		}
	}

	/**
	 * Check the device to make sure it has the Google Play Services APK. If it
	 * doesn't, display a dialog that allows users to download the APK from the
	 * Google Play Store or enable it in the device's system settings.
	 */
	private boolean checkPlayServices() {
		int resultCode = GooglePlayServicesUtil
				.isGooglePlayServicesAvailable(this);
		if (resultCode != ConnectionResult.SUCCESS) {
			if (GooglePlayServicesUtil.isUserRecoverableError(resultCode)) {
				GooglePlayServicesUtil.getErrorDialog(resultCode, this,
						PLAY_SERVICES_RESOLUTION_REQUEST).show();
			} else {
				Log.i(GCM_TAG, "This device is not supported.");
				finish();
			}
			return false;
		}
		return true;
	}

	/**
	 * Gets the current registration ID for application on GCM service, if there
	 * is one. If result is empty, the app needs to register.
	 * 
	 * @return registration ID, or empty string if there is no existing
	 *         registration ID.
	 */
	private String getRegistrationId(Context context) {
		final SharedPreferences prefs = getGcmPreferences(context);
		String registrationId = prefs.getString(PROPERTY_REG_ID, "");
		if (registrationId.isEmpty()) {
			Log.i(GCM_TAG, "Registration not found.");
			return "";
		}
		// Check if app was updated; if so, it must clear the registration ID
		// since the existing regID is not guaranteed to work with the new
		// app version.
		int registeredVersion = prefs.getInt(PROPERTY_APP_VERSION,
				Integer.MIN_VALUE);
		int currentVersion = getAppVersion(context);
		if (registeredVersion != currentVersion) {
			Log.i(GCM_TAG, "App version changed.");
			return "";
		}
		return registrationId;
	}

	/**
	 * Registers the application with GCM servers asynchronously. Stores the
	 * registration ID and the app versionCode in the application's shared
	 * preferences.
	 */
	private void registerInBackground() {
		new AsyncTask<Void, Void, String>() {
			@Override
			protected String doInBackground(Void... params) {
				String msg = "";
				try {
					if (gcm == null) {
						gcm = GoogleCloudMessaging.getInstance(applicationContext);
					}
					regid = gcm.register(getString(R.string.project_number));
					msg = "Device registered. Registration ID : " + regid;

					// Send the registration ID to your server over HTTP, so it
					// can use GCM to send messages.
					// sendRegistrationIdToBackend();

					// Persist the regID - no need to register again.
					storeRegistrationId(applicationContext, regid);
				} catch (IOException ex) {
					msg = "Error : " + ex.getMessage();
				}
				Log.i(GCM_TAG, msg);
				return msg;
			}
		}.execute(null, null, null);
	}

	/**
	 * Stores the registration ID and the app versionCode in the application's
	 * {@code SharedPreferences}.
	 * 
	 * @param context
	 *            application's context.
	 * @param regId
	 *            registration ID
	 */
	private void storeRegistrationId(Context context, String regId) {
		final SharedPreferences prefs = getGcmPreferences(context);
		int appVersion = getAppVersion(context);
		Log.i(GCM_TAG, "Saving regId on app version " + appVersion);
		SharedPreferences.Editor editor = prefs.edit();
		editor.putString(PROPERTY_REG_ID, regId);
		editor.putInt(PROPERTY_APP_VERSION, appVersion);
		editor.commit();
	}

	public int getLevel() {
		return level;
	}

	public View getAppView() {
		return this.appView;
	}

	/**
	 * @return Application's version code from the {@code PackageManager}.
	 */
	private static int getAppVersion(Context context) {
		try {
			PackageInfo packageInfo = context.getPackageManager()
					.getPackageInfo(context.getPackageName(), 0);
			return packageInfo.versionCode;
		} catch (NameNotFoundException e) {
			// should never happen
			throw new RuntimeException("Could not get package name: " + e);
		}
	}

	/**
	 * @return Application's {@code SharedPreferences}.
	 */
	private SharedPreferences getGcmPreferences(Context context) {
		return getSharedPreferences(CommunityActivity.class.getSimpleName(),
				Context.MODE_PRIVATE);
	}
}
