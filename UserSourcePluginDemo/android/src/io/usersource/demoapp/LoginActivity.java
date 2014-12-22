package io.usersource.demoapp;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;

import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.support.v4.app.FragmentActivity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.GridView;
import android.widget.Toast;

public class LoginActivity extends FragmentActivity {
	private LoginFragment loginFragment;
	static Menu mainMenu;

	private GridView gridView;
	private GridViewAdapter customGridAdapter;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		setContentView(R.layout.main);
		gridView = (GridView) findViewById(R.id.gridView);
		customGridAdapter = new GridViewAdapter(this, R.layout.row_grid, getData());
		gridView.setAdapter(customGridAdapter);

		gridView.setOnItemClickListener(new OnItemClickListener() {
			public void onItemClick(AdapterView<?> parent, View v, int position, long id) {
				Toast.makeText(LoginActivity.this, position + "#Selected", Toast.LENGTH_SHORT).show();
			}
		});

	    if (savedInstanceState == null) {
	        loginFragment = new LoginFragment();
	        getSupportFragmentManager().beginTransaction().add(android.R.id.content, loginFragment).commit();
	    } else {
	        loginFragment = (LoginFragment) getSupportFragmentManager().findFragmentById(android.R.id.content);
	    }
	}

	private ArrayList<ImageItem> getData() {
		final ArrayList<ImageItem> imageItems = new ArrayList<ImageItem>();

		File picturePath = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
		for (File file : picturePath.listFiles()) {
			File imageUri = file.listFiles()[0];
	        Bitmap bitmap = null;
			try {
				bitmap = MediaStore.Images.Media.getBitmap(this.getContentResolver(), Uri.fromFile(imageUri));
			} catch (FileNotFoundException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();
			}
			imageItems.add(new ImageItem(bitmap, file.getName()));
		}

		return imageItems;
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		getMenuInflater().inflate(R.menu.main, menu);
		updateMenuItemTitle(menu);
		mainMenu = menu;
		return true;
	}

	public static void updateMenuItemTitle(Menu menu) {
		menu = (menu == null) ? mainMenu : menu;
		if (LoginFragment.sessionState != null && menu != null) {
			if (LoginFragment.sessionState.isOpened()) {
				menu.getItem(0).setTitle(R.string.facebook_logout);
			} else if (LoginFragment.sessionState.isClosed()) {
				menu.getItem(0).setTitle(R.string.facebook_login);
			}
		}
	}

	@Override
	public boolean onMenuItemSelected(int featureId, MenuItem item) {
		if (item.getTitle() == getString(R.string.action_settings)) {
			return true;
		} else if (item.getTitle() == getString(R.string.facebook_login)
				|| (item.getTitle() == getString(R.string.facebook_logout))) {
			loginFragment.authButton.performClick();
			return true;
		}
		return false;
	}
}
