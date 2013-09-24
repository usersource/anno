package io.usersource.annoplugin.view;

import io.usersource.annoplugin.R;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.os.Bundle;
import android.preference.EditTextPreference;
import android.preference.PreferenceActivity;
import android.view.MenuItem;

/**
 * This is the setting preference.
 * 
 * It provides a way for developer/test users to change server url quickly.
 * 
 * @author topcircler
 * 
 */
public class AnnoSettingActivity extends PreferenceActivity implements
    OnSharedPreferenceChangeListener {

  private EditTextPreference mSyncServerUrlPref;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getActionBar().setDisplayHomeAsUpEnabled(true);
    this.addPreferencesFromResource(R.xml.anno_preferences);
    mSyncServerUrlPref = (EditTextPreference) getPreferenceScreen()
        .findPreference(getString(R.string.prefSyncServerUrl_Key));
  }

  @Override
  public boolean onOptionsItemSelected(MenuItem item) {
    switch (item.getItemId()) {
    case android.R.id.home:
      this.finish();
      return true;
    default:
      return super.onOptionsItemSelected(item);
    }
  }

  @Override
  protected void onResume() {
    super.onResume();
    mSyncServerUrlPref.setSummary(getPreferenceScreen().getSharedPreferences()
        .getString(getString(R.string.prefSyncServerUrl_Key), ""));
    // Set up a listener whenever a key changes
    getPreferenceScreen().getSharedPreferences()
        .registerOnSharedPreferenceChangeListener(this);
  }

  @Override
  protected void onPause() {
    super.onPause();
    // Unregister the listener whenever a key changes
    getPreferenceScreen().getSharedPreferences()
        .unregisterOnSharedPreferenceChangeListener(this);
  }

  @Override
  public void onSharedPreferenceChanged(SharedPreferences sharedPreferences,
      String key) {
    if (key.equals(getString(R.string.prefSyncServerUrl_Key))) {
      mSyncServerUrlPref.setSummary(sharedPreferences.getString(
          getString(R.string.prefSyncServerUrl_Key), ""));
    }
  }

}
