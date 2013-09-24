package io.usersource.annoplugin.sync;

import io.usersource.annoplugin.datastore.TableUsers;
import io.usersource.annoplugin.model.AnnoContentProvider;
import io.usersource.annoplugin.network.IHttpRequestHandler;
import io.usersource.annoplugin.utils.AccountUtils;
import io.usersource.annoplugin.utils.Constants;
import io.usersource.annoplugin.utils.SystemUtils;

import java.io.IOException;
import java.util.ArrayList;

import org.apache.http.NameValuePair;
import org.apache.http.ParseException;
import org.apache.http.message.BasicNameValuePair;
import org.json.JSONException;
import org.json.JSONObject;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.content.ContentProviderClient;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.SyncResult;
import android.database.Cursor;
import android.os.Bundle;
import android.util.Log;

public class AnnoSyncAdapter extends BaseSyncAdapter {
	
	private UsersManager mUser;
	private static final String TAG = "AnnoSyncAdapter";

	public AnnoSyncAdapter(Context context, boolean autoInitialize) {
		super(context, autoInitialize);
		
		mUser = new UsersManager(context);
	}

	public AnnoSyncAdapter(Context context, boolean autoInitialize,
			boolean allowParallelSyncs) {
		super(context, autoInitialize, allowParallelSyncs);
	}

	@Override
	public void onPerformSync(Account arg0, Bundle arg1, String arg2,
			ContentProviderClient arg3, SyncResult arg4) {
		
		String userId = mUser.getUserID();
		if( userId == null)
		{
			CreateUser();
		}
		else
		{
			performSyncRoutines(userId);
		}
	}
	
	private void CreateUser()
	{
		JSONObject request = new JSONObject();
		try {
			request.put(RequestCreater.JSON_REQUEST_TYPE, "create_user");
			request.put("user_name", SystemUtils.getModel()); 
			
			final ArrayList<NameValuePair> params = new ArrayList<NameValuePair>();
			params.add(new BasicNameValuePair(SyncAdapter.JSON_REQUEST_PARAM_NAME,
		            request.toString()));
			
			getHttpConnector().sendRequest("/users", params, new IHttpRequestHandler() {
	              public void onRequest(JSONObject response) {
	            	  try {
	            		  if (response != null) {
	            			  ContentValues user = new ContentValues();
	                		  user.put(TableUsers.COL_USER_ID, response.getString("user_id"));
							  user.put(TableUsers.COL_DISPLAY_ID, response.getString("user_name"));
							  mUser.createNewUser(user); 					
							  performSyncRoutines(response.getString("user_id"));
	            		  }
    		  
	            	  } catch (JSONException e) {
						e.printStackTrace();
	            	  }
	              }
	            });
			
		} catch (JSONException e) {
			e.printStackTrace();
		} catch (ParseException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	public static void requestSync(Context context) {
	   
		// if there is no network connectivity, no need to synchronize.
	    if (!SystemUtils.isOnline(context)) {
	      Log.i(TAG, "Device is offline, won't synchronize.");
	      return;
	    }

	    Account accountUse = AnnoSyncAdapter.createSyncAccount(context);
	    if( accountUse != null )
	    {
	    	Log.i(TAG, "GAE Sync using account - " + accountUse);
	    	Bundle extras = new Bundle();
	    	extras.putBoolean(ContentResolver.SYNC_EXTRAS_MANUAL, true);
	    	ContentResolver.requestSync(accountUse, AnnoContentProvider.AUTHORITY, extras);
	    }
	}
	
	public static Account createSyncAccount(Context context) {
		
		Account result = null;
		Account[] accounts = AccountUtils.getAllAccounts(context, Constants.ACCOUNT_TYPE_USERSOURCE);
	    if (accounts == null || accounts.length == 0) {
	    	
	    	Log.i(TAG, "No available anno account, create a new.");
	    	result = new Account(Constants.ACCOUNT, Constants.ACCOUNT_TYPE_USERSOURCE);
		    AccountManager manager = (AccountManager) context.getSystemService(Context.ACCOUNT_SERVICE);
		      
		    if(manager.addAccountExplicitly(result, null, null))
		    {
		    	Log.i(TAG, "Usersource account for sync has been added");
		    	ContentResolver.setSyncAutomatically(result, AnnoContentProvider.AUTHORITY, true);
		    }
		    else
		    {
		    	Log.i(TAG, "Error accured when try to add usersource account");
		    	result = null;
		    }
	    }
	    else
	    {
	    	result = accounts[0];
	    }
	    return result;
	}

}
