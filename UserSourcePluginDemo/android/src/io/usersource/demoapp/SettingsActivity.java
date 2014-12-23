package io.usersource.demoapp;

import io.usersource.annoplugin.AnnoSingleton;
import io.usersource.annoplugin.shake.ShakeEnabler;
import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.CheckedTextView;

public class SettingsActivity extends Activity {
	private AnnoSingleton annoSingleton = null;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.settings);

		annoSingleton = AnnoSingleton.getInstance(this);
	    ShakeEnabler.startListening(this);

		final CheckedTextView checkedTextView = (CheckedTextView) findViewById(R.id.allowShake);
		checkedTextView.setChecked(AnnoSingleton.allowShake);
		checkedTextView.setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View v) {
				if (checkedTextView.isChecked())
					checkedTextView.setChecked(false);
				else
					checkedTextView.setChecked(true);
				annoSingleton.saveAllowShake(checkedTextView.isChecked());
			}
		});
	}
}
