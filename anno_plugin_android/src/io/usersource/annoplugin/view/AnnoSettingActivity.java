package io.usersource.annoplugin.view;

import io.usersource.annoplugin.R;
import io.usersource.annoplugin.model.AnnoContentProvider;
import android.content.ContentProviderClient;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.os.Bundle;
import android.preference.ListPreference;
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

  private ListPreference mSyncServerUrlPref;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getActionBar().setDisplayHomeAsUpEnabled(true);
    this.addPreferencesFromResource(R.xml.anno_preferences);
    mSyncServerUrlPref = (ListPreference) getPreferenceScreen().findPreference(
        getString(R.string.prefSyncServerUrl_Key));
    loadServerURLs();
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
    this.loadServerURLs();
    mSyncServerUrlPref.setSummary(mSyncServerUrlPref.getEntry());
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
      mSyncServerUrlPref.setSummary(mSyncServerUrlPref.getEntry());

      ContentProviderClient client = getContentResolver()
          .acquireContentProviderClient(AnnoContentProvider.AUTHORITY);
      if (client != null) {
        ((AnnoContentProvider) client.getLocalContentProvider())
            .resetDatabase();
        client.release();
      }
    }
  }

  private void loadServerURLs() {
    String[] names = { "Production", "Test", "Production via EC2 proxy",
        "Test via EC2 proxy" };
    String[] urls = { "http://annoserver.appspot.com",
        "http://annoserver-test.appspot.com",
        "http://ec2-54-213-161-127.us-west-2.compute.amazonaws.com",
        "http://ec2-54-213-161-127.us-west-2.compute.amazonaws.com/annotest" };
    mSyncServerUrlPref.setEntries(names);
    mSyncServerUrlPref.setEntryValues(urls);
    mSyncServerUrlPref
        .setDefaultValue("http://ec2-54-213-161-127.us-west-2.compute.amazonaws.com/annotest");
  }
}
