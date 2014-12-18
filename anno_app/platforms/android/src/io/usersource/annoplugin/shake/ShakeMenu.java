package io.usersource.annoplugin.shake;

import java.io.File;

import io.usersource.anno.R;
import io.usersource.annoplugin.AnnoSingleton;
import android.app.Activity;
import android.os.Bundle;
import android.view.View;

public class ShakeMenu extends Activity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.shake_menu);
	}

	public void closeShakeMenu(View view) {
		this.finish();
		ShakeActivitySession.shakeMenuVisible = false;
	}

	public void clickedViewFeedback(View view) {
		closeShakeMenu(view);
		AnnoSingleton.getInstance(null).showCommunityPage(AnnoSingleton.appActivity);
	}

	public void clickedNewFeedback(View view) {
		closeShakeMenu(view);
		String screenshotPath = ShakeActivitySession.screenshotPath;
		File imageFile = new File(screenshotPath);
		String imageURI = "file://" + imageFile.getPath();
		AnnoSingleton.getInstance(null).showAnnoDrawPage(AnnoSingleton.appActivity, imageURI);
	}
}
