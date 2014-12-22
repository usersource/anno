package io.usersource.demoapp;

import android.os.Bundle;
import android.support.v4.app.FragmentActivity;
import android.view.Menu;

public class LoginActivity extends FragmentActivity {
	private LoginFragment loginFragment;

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
		return true;
	}
}
