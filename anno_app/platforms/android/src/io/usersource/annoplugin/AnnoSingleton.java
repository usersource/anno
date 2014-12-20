package io.usersource.annoplugin;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Random;

import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import io.usersource.anno.CommunityActivity;
import io.usersource.annoplugin.shake.ShakeEnabler;
import io.usersource.annoplugin.utils.AnnoUtils;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.AsyncTask;
import android.util.Log;

public class AnnoSingleton {
	private static AnnoSingleton instance = null;

	String ANONYMOUS_USER_EMAIL = "dev%s@devnull.usersource.io";
	String ANONYMOUS_USER_DISPLAY_NAME = "Anonymous";
	String UNREAD_URL = "/anno/1.0/user/unread";
	public static String TAG = "Annot8 Plugin";
	String SERVER_CONFIG_FILE_PATH = "www/anno/scripts/server-url.json";
	String PLUGIN_CONFIG_FILE_PATH = "www/anno/scripts/plugin_settings/pluginConfig.json";

	public static Boolean annot8Visible = false;
	public static Boolean showUnreadMyActivityNotification = true;

	String email, displayName, userImageURL, teamKey, teamSecret;
	JSONObject serverConfig, pluginConfig;
	String cloudHost;

	Boolean unreadCountPresent;
	Integer unreadCount;

	String[] shakeSensitivityValues = { "1 Shake", "2 Shakes", "3 Shakes" };
	JSONObject shakeSettingsData;
	public static Boolean allowShake;
	public static Integer shakeValue;

	Class<?> customInfoActivity = null;
	public static Context appContext = null;
	public static Activity appActivity = null;

	protected AnnoSingleton() {
		cloudHost = "https://annoserver.appspot.com/_ah/api";
		unreadCount = 0;
		unreadCountPresent = false;
		allowShake = true;
		shakeValue = 0;
	}

	public static AnnoSingleton getInstance(Context context) {
		if (instance == null) {
			instance = new AnnoSingleton();
			if ((appContext == null) && (context != null)) {
				appContext = context.getApplicationContext();
				appActivity = (Activity)context;
			}
		}
		return instance;
	}

	private void initMethod() {
		readServerConfiguration();
		readPluginConfiguration();
		getShakeSettings();
	}

	private void getShakeSettings() {
		// data sturcture for shake settings
		// { "shakeSettings" : { "<user_email>" : { "allowShake" : BOOL, "shakeValue" : int }}}
		SharedPreferences sharedPref = appActivity.getPreferences(Context.MODE_PRIVATE);
		String strJson = sharedPref.getString("shakeSettings", null);

		try {
			if (strJson != null) {
				shakeSettingsData = new JSONObject(strJson);
				shakeSettingsData = shakeSettingsData.getJSONObject(this.email);
			} else {
				shakeSettingsData = new JSONObject();
				shakeSettingsData.put("allowShake", true);
				shakeSettingsData.put("shakeValue", 0);
			}

			allowShake = shakeSettingsData.getBoolean("allowShake");
			shakeValue = shakeSettingsData.getInt("shakeValue");
		} catch (JSONException e) {
			e.printStackTrace();
		}
	}

	public void saveAllowShake(Boolean allowShakeValue) {
		allowShake = allowShakeValue;
		saveShakeSettings();
	}

	public void saveShakeValue(Integer shakeValueNumber) {
		shakeValue = shakeValueNumber;
		saveShakeSettings();
	}

	private void saveShakeSettings() {
		try {
			shakeSettingsData.put("allowShake", allowShake);
			shakeSettingsData.put("shakeValue", shakeValue);

			SharedPreferences sharedPref = appActivity.getPreferences(Context.MODE_PRIVATE);
			String strJson = sharedPref.getString("shakeSettings", null);
			JSONObject tempShakeSettingsData = new JSONObject(strJson);
			tempShakeSettingsData.put(this.email, shakeSettingsData);

			SharedPreferences.Editor editor = sharedPref.edit();
			editor.putString("shakeSettings", tempShakeSettingsData.toString());
			editor.commit();
		} catch (JSONException e) {
			e.printStackTrace();
		}
	}

	public void setupWithUserInfo(String emailValue, String displayNameValue,
			String userImageURLValue, String teamKeyValue,
			String teamSecretValue) {
		this.email = emailValue;
		this.displayName = displayNameValue;
		this.userImageURL = userImageURLValue;
		this.teamKey = teamKeyValue;
		this.teamSecret = teamSecretValue;
		initMethod();
	}

	public void setupAnonymousUserWithTeamCredentials(String teamKeyValue, String teamSecretValue) {
		String secs = String.format("%d", System.currentTimeMillis() / 1000);
		String randomNum = String.format("%d", (new Random()).nextInt(100) + 0);
		String additionalString = String.format("%s%s", secs, randomNum);
		String emailValue = String.format(ANONYMOUS_USER_EMAIL, additionalString);
		String displayNameValue = ANONYMOUS_USER_DISPLAY_NAME;
		this.setupWithUserInfo(emailValue, displayNameValue, "", teamKeyValue, teamSecretValue);
	}

	public void setCustomInfoActivity(Class<?> customInfo) {
		this.customInfoActivity = customInfo;
	}

	public void showCommunityPage(Activity activity) {
		if (this.email == null || this.email == "") {
			Log.d(TAG, "Email address is not specified.");
			return;
		}

		if (this.teamKey == null || this.teamKey == "" ||
			this.teamSecret == null || this.teamSecret == "") {
			Log.d(TAG, "TeamKey and TeamSecret are not specified.");
			return;
		}

		Intent intent = new Intent(activity, CommunityActivity.class);
		activity.startActivity(intent);
		annot8Visible = true;
	}

	public void showAnnoDrawPage(Activity activity, String imageURI) {
		Boolean isPlugin = !(AnnoUtils.isAnno(activity.getPackageName()));

		if (isPlugin && (this.email == null || this.email == "")) {
			Log.d(TAG, "Email address is not specified.");
			return;
		}

		String packageName = activity.getPackageName();
		Intent intent = new Intent(Intent.ACTION_SEND);
		intent.setClassName(packageName, "io.usersource.anno.AnnoDrawActivity");
		intent.setType("image/*");
		Uri imageUri = Uri.parse(imageURI);
		intent.putExtra(Intent.EXTRA_STREAM, imageUri);
		intent.putExtra(AnnoUtils.LEVEL, 0);
		activity.startActivity(intent);
		annot8Visible = true;
	}

	public JSONArray getUserInfo() {
		JSONArray returnData = new JSONArray();
		returnData.put(this.email);
		returnData.put(this.displayName);
		returnData.put(this.userImageURL);
		returnData.put(this.teamKey);
		returnData.put(this.teamSecret);
		return returnData;
	}

	private JSONObject readJSONFromFile(String filePath) throws JSONException {
		String json = null;
		JSONObject jsonData;

		try {
			InputStream is = appContext.getAssets().open(filePath);
		    byte[] buffer = new byte[is.available()];
		    is.read(buffer);
		    is.close();
		    json = new String(buffer, "UTF-8");
		    jsonData = new JSONObject(json);
		} catch (IOException ex) {
		    ex.printStackTrace();
		    return null;
		}

		return jsonData;
	}

	public void readServerConfiguration() {
		try {
			serverConfig = readJSONFromFile(SERVER_CONFIG_FILE_PATH);
			cloudHost = serverConfig.getJSONObject("1").getString("apiRoot");
			if (showUnreadMyActivityNotification) {
				showNewMyActivityNotification();
			}
		} catch (JSONException e) {
			e.printStackTrace();
			serverConfig = null;
			cloudHost = "";
		}
	}

	public void readPluginConfiguration() {
		try {
			pluginConfig = readJSONFromFile(PLUGIN_CONFIG_FILE_PATH);
		} catch (JSONException e) {
			e.printStackTrace();
			pluginConfig = null;
		}
	}

	public void showNewMyActivityNotification() {
		String uri = cloudHost + UNREAD_URL;
		uri.concat(String.format("?user_email=%s&team_key=%s", this.email, this.teamKey));
		new makeHTTPCall().execute(uri);
	}

	private class makeHTTPCall extends AsyncTask<String, Integer, String> {
		protected String doInBackground(String... urls) {
			Log.e(AnnoSingleton.TAG, urls[0]);
			HttpClient httpClient = new DefaultHttpClient();
			HttpGet httpGet = new HttpGet(urls[0]);

			try {
				HttpResponse response = httpClient.execute(httpGet);
				InputStream inputStream = new BufferedInputStream(response.getEntity().getContent());
				String responseData = convertInputStreamToString(inputStream);
				return responseData;
			} catch (ClientProtocolException  e) {
				e.printStackTrace();
				return null;
			} catch (IOException e) {
				e.printStackTrace();
				return null;
			}
		}

		@Override
		protected void onProgressUpdate(Integer... values) {}

		@Override
		protected void onPostExecute(String responseData) {
			JSONObject results;
			try {
				results = new JSONObject(responseData);
				unreadCountPresent = true;
				unreadCount = results.getInt("unread_count");
				if (unreadCount > 0) {
					String message = String.format("New Activity on %s item%s", unreadCount, (unreadCount > 1) ? "s" : "");
					new AlertDialog.Builder(appActivity)
							.setTitle("Your Feedback")
							.setMessage(message)
							.setPositiveButton("Show Me", new DialogInterface.OnClickListener() {
										public void onClick(
												DialogInterface dialog,
												int which) {
											instance.showCommunityPage(appActivity);
										}
									})
							.setNegativeButton("Later", new DialogInterface.OnClickListener() {
										public void onClick(
												DialogInterface dialog,
												int which) {
										}
									}).show();
				}
			} catch (JSONException e) {
				e.printStackTrace();
			}
		}
	}

	private String convertInputStreamToString(InputStream inputStream) throws IOException {
		BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
		String line = "";
		String result = "";

		while ((line = bufferedReader.readLine()) != null) {
			result += line;
		}

		/* Close Stream */
		if (null != inputStream) {
			inputStream.close();
		}

		return result;
	}
}