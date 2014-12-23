package io.usersource.demoapp;

import io.usersource.demoapp.adapter.GridViewAdapter;
import io.usersource.demoapp.helper.AppConstant;
import io.usersource.demoapp.helper.Utils;

import java.util.ArrayList;

import android.content.res.Resources;
import android.os.Bundle;
import android.support.v4.app.FragmentActivity;
import android.util.TypedValue;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.GridView;

public class LoginActivity extends FragmentActivity {
	private LoginFragment loginFragment;
	static Menu mainMenu;

	private Utils utils;
    private ArrayList<String> imagePaths = new ArrayList<String>();
    private GridViewAdapter adapter;
    private GridView gridView;
    private int columnWidth;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.main);
		
		gridView = (GridView) findViewById(R.id.gridView);
        utils = new Utils(this); 
        InitilizeGridLayout();
        imagePaths = utils.getFilePaths();
        adapter = new GridViewAdapter(LoginActivity.this, imagePaths, columnWidth);
        gridView.setAdapter(adapter);

	    if (savedInstanceState == null) {
	        loginFragment = new LoginFragment();
	        getSupportFragmentManager().beginTransaction().add(android.R.id.content, loginFragment).commit();
	    } else {
	        loginFragment = (LoginFragment) getSupportFragmentManager().findFragmentById(android.R.id.content);
	    }
	}

	private void InitilizeGridLayout() {
		Resources r = getResources();
		float padding = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, AppConstant.GRID_PADDING, r.getDisplayMetrics());

		columnWidth = (int) ((utils.getScreenWidth() - ((AppConstant.NUM_OF_COLUMNS + 1) * padding)) / AppConstant.NUM_OF_COLUMNS);

		gridView.setNumColumns(AppConstant.NUM_OF_COLUMNS);
		gridView.setColumnWidth(columnWidth);
		gridView.setStretchMode(GridView.NO_STRETCH);
		gridView.setPadding((int) padding, (int) padding, (int) padding, (int) padding);
		gridView.setHorizontalSpacing((int) padding);
		gridView.setVerticalSpacing((int) padding);
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
