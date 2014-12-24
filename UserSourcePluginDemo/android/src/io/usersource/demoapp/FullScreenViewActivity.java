package io.usersource.demoapp;

import java.util.ArrayList;

import io.usersource.annoplugin.shake.ShakeEnabler;
import io.usersource.demoapp.adapter.FullScreenImageAdapter;
import io.usersource.demoapp.helper.Utils;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.support.v4.view.ViewPager;

public class FullScreenViewActivity extends Activity {
	private FullScreenImageAdapter adapter;
	private ViewPager viewPager;
	private ArrayList<String> imagePaths = new ArrayList<String>();

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_fullscreen_view);

		ShakeEnabler.startListening(this);

		viewPager = (ViewPager) findViewById(R.id.pager);
		Intent i = getIntent();
		int position = i.getIntExtra("position", 0);
		imagePaths = Utils.getInstance(this).getFilePaths();
		adapter = new FullScreenImageAdapter(FullScreenViewActivity.this, imagePaths);
		viewPager.setAdapter(adapter);
		viewPager.setCurrentItem(position);
	}
}
