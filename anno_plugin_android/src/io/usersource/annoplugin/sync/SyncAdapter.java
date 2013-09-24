package io.usersource.annoplugin.sync;

import io.usersource.annoplugin.model.AnnoContentProvider;
import io.usersource.annoplugin.network.HttpConnector;
import io.usersource.annoplugin.network.IHttpConnectorAuthHandler;
import io.usersource.annoplugin.utils.AccountUtils;
import io.usersource.annoplugin.utils.SystemUtils;
import android.accounts.Account;
import android.content.ContentProviderClient;
import android.content.ContentResolver;
import android.content.Context;
import android.content.SyncResult;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

/**
 * This class implements synchronization with server.
 * 
 * @author Sergey Gadzhilov
 * @author topcircler
 * 
 */
public class SyncAdapter extends BaseSyncAdapter {
	
   private static final String TAG = "SyncAdapter";
  
  /**
   * {@inheritDoc}
   */
  public SyncAdapter(Context context, boolean autoInitialize) {
    super(context, autoInitialize);
  }

  public static void requestSync(Context context) {
    // if there is no network connectivity, no need to synchronize.
    if (!SystemUtils.isOnline(context)) {
      Log.i(TAG, "Device is offline, won't synchronize.");
      return;
    }

    Account[] accounts = AccountUtils.getAllAccounts(context, null);
    if (accounts == null || accounts.length == 0) {
      // TODO: consider asking user to add an account?
      Log.i(TAG, "No available google account, won't synchronize.");
      return;
    }

    Account accountUse = accounts[0];
    Log.i(TAG, "GAE Sync using account - " + accountUse);
    Bundle extras = new Bundle();
    extras.putBoolean(ContentResolver.SYNC_EXTRAS_MANUAL, true);
    ContentResolver.requestSync(accountUse, AnnoContentProvider.AUTHORITY,
        extras);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public void onPerformSync(Account account, Bundle extras, String authority,
      ContentProviderClient provider, SyncResult syncResult) {
   
	HttpConnector httpConnector = getHttpConnector();
    if (httpConnector.isAuthenticated()) {
      Log.d(TAG, "httpConnector.isAuthenticated()==true. Perform sync.");
      performSyncRoutines(null);
    } else {
      Log.d(TAG, "httpConnector.isAuthenticated()==false. Perform auth.");
      httpConnector
          .setHttpConnectorAuthHandler(new IHttpConnectorAuthHandler() {

            public void onAuthSuccess() {
              Log.i(TAG, "Synchronize - Authentication succeeded.");
              performSyncRoutines(null);
            }

            public void onAuthFail() {
              Log.i(TAG, "Synchronize - Authentication failed.");
              Toast.makeText(getContext(), "Auth to sync service failed",
                  Toast.LENGTH_LONG).show();
            }
          });
      httpConnector.authenticate(getContext(), account);
    }
  }

}
