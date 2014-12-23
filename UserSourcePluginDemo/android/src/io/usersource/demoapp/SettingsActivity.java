package io.usersource.demoapp;

import io.usersource.annoplugin.AnnoSingleton;
import io.usersource.annoplugin.shake.ShakeEnabler;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.view.View;
import android.widget.CheckedTextView;
import android.widget.RelativeLayout;
import android.widget.TextView;

public class SettingsActivity extends Activity {
	private AnnoSingleton annoSingleton = null;

	CheckedTextView checkedTextView;
	TextView shakeValueTextView;
	RelativeLayout shakeSensitivityLayout;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.settings);

		annoSingleton = AnnoSingleton.getInstance(this);
		ShakeEnabler.startListening(this);

		shakeSensitivityLayout = (RelativeLayout) findViewById(R.id.shakeSensitivity);
		shakeSensitivityLayout.setClickable(AnnoSingleton.allowShake);

		checkedTextView = (CheckedTextView) findViewById(R.id.allowShake);
		checkedTextView.setChecked(AnnoSingleton.allowShake);

		shakeValueTextView = (TextView) findViewById(R.id.shakeSensitivityValue);
		shakeValueTextView.setText(AnnoSingleton.shakeSensitivityValues.get(AnnoSingleton.shakeValue));
	}

	public void toggleAllowShake(View view) {
		Boolean allowShakeValue = !checkedTextView.isChecked();
		checkedTextView.setChecked(allowShakeValue);
		shakeSensitivityLayout.setClickable(allowShakeValue);
		annoSingleton.saveAllowShake(allowShakeValue);
	}

	public void showShakeSensitivityDialog(View view) {
		AlertDialog.Builder builder = new AlertDialog.Builder(this);
		builder.setTitle("Choose Shake Sensitivity Value").setItems(
				R.array.shakeSensitivityValues,
				new DialogInterface.OnClickListener() {
					public void onClick(DialogInterface dialog, int which) {
						annoSingleton.saveShakeValue(which);
						shakeValueTextView.setText(AnnoSingleton.shakeSensitivityValues.get(which));
					}
				});
		builder.create().show();
	}
}
