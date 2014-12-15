package io.usersource.annoplugin;

import java.util.Random;

import org.json.JSONArray;

import io.usersource.anno.CommunityActivity;
import io.usersource.annoplugin.utils.AnnoUtils;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

public class AnnoSingleton {
	private static AnnoSingleton instance = null;

	String ANONYMOUS_USER_EMAIL = "dev%s@devnull.usersource.io";
	String ANONYMOUS_USER_DISPLAY_NAME = "Anonymous";

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

	public void setupWithUserInfo(String emailValue, String displayNameValue,
			String userImageURLValue, String teamKeyValue,
			String teamSecretValue) {
		this.email = emailValue;
		this.displayName = displayNameValue;
		this.userImageURL = userImageURLValue;
		this.teamKey = teamKeyValue;
		this.teamSecret = teamSecretValue;
	}

	public void setupAnonymousUserWithTeamCredentials(String teamKeyValue,
			String teamSecretValue) {
		String secs = String.format("%d", System.currentTimeMillis() / 1000);
		String randomNum = String.format("%d", (new Random()).nextInt(100) + 0);
		String additionalString = String.format("%s%s", secs, randomNum);
		String emailValue = String.format(ANONYMOUS_USER_EMAIL,
				additionalString);
		this.setupWithUserInfo(emailValue, "", "", teamKeyValue,
				teamSecretValue);
	}

	public void showCommunityPage(Activity activity) {
		Intent intent = new Intent(activity, CommunityActivity.class);
		activity.startActivity(intent);
	}

	public void showAnnoDrawPage(Activity activity, String imageURI) {
		String packageName = activity.getPackageName();
		Intent intent = new Intent(Intent.ACTION_SEND);
		intent.setClassName(packageName, "io.usersource.anno.AnnoDrawActivity");
		intent.setType("image/*");
		Uri imageUri = Uri.parse(imageURI);
		intent.putExtra(Intent.EXTRA_STREAM, imageUri);
		intent.putExtra(AnnoUtils.LEVEL, 0);
		activity.startActivity(intent);
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
}