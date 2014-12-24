package io.usersource.demoapp;

import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.FragmentActivity;
import android.view.Menu;
import android.view.MenuItem;

public class LoginActivity extends FragmentActivity {
	private LoginFragment loginFragment;
	static Menu mainMenu;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

	    if (savedInstanceState == null) {
	        loginFragment = new LoginFragment();
	        getSupportFragmentManager().beginTransaction().add(android.R.id.content, loginFragment).commit();
	    } else {
	        loginFragment = (LoginFragment) getSupportFragmentManager().findFragmentById(android.R.id.content);
	    }
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
			Intent intent = new Intent(this, SettingsActivity.class);
			this.startActivity(intent);
			return true;
		} else if (item.getTitle() == getString(R.string.facebook_login)
				|| (item.getTitle() == getString(R.string.facebook_logout))) {
			loginFragment.authButton.performClick();
			return true;
		}
		return false;
	}
}
