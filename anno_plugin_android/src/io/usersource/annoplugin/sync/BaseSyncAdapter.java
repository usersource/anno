package io.usersource.annoplugin.sync;

import io.usersource.annoplugin.network.HttpConnector;
import io.usersource.annoplugin.network.IHttpRequestHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Map;

import org.apache.http.NameValuePair;
import org.apache.http.message.BasicNameValuePair;
import org.json.JSONObject;

import android.accounts.Account;
import android.content.AbstractThreadedSyncAdapter;
import android.content.ContentProviderClient;
import android.content.Context;
import android.content.SyncResult;
import android.database.Cursor;
import android.os.Bundle;
import android.util.Log;

/**
 * This is base class for sync adapter. 
 * 
 * @author Sergey Gadzhilov
 *
 */

public class BaseSyncAdapter extends AbstractThreadedSyncAdapter {
	
	public static final String JSON_REQUEST_PARAM_NAME = "jsonData";
	
	private static final String TAG = "BaseSyncAdapter";

	private HttpConnector httpConnector;
	protected RequestCreater request;
	
	protected DatabaseUpdater db;

	public BaseSyncAdapter(Context context, boolean autoInitialize) {
		super(context, autoInitialize);
		db = new DatabaseUpdater(context);
	}

	public BaseSyncAdapter(Context context, boolean autoInitialize,
			boolean allowParallelSyncs) {
		super(context, autoInitialize, allowParallelSyncs);
	}

	@Override
	public void onPerformSync(Account account, Bundle extras, String authority,
		ContentProviderClient provider, SyncResult syncResult) {
		
	}
	
	protected void performSyncRoutines(String userId) {
		Log.i(TAG, "Start synchronization");
	    try {
	      getLocalData(userId);

	      final ArrayList<NameValuePair> params = new ArrayList<NameValuePair>();
	      Log.i(TAG, "Send generateKeys request.");
	      params.add(new BasicNameValuePair(SyncAdapter.JSON_REQUEST_PARAM_NAME,
	          request.getKeysRequest().toString()));
	      getHttpConnector().sendRequest("/sync", params,
	          new IHttpRequestHandler() {

	            public void onRequest(JSONObject response) {
	              if (response != null) {
	                updateLocalKeys(response);
	              }
	            }
	          });

	    } catch (IOException e) {
	      Log.e(TAG, e.getMessage(), e);
	    }
	}
	
	/**
	 * This function reads information from local database.
	 * 
	 * @return local data in json format
	 */
	private void getLocalData(String userId) {
	    Log.v(TAG, "Populate local data that not synched into request.");
	   	request = new RequestCreater(getContext());
	   	request.setUserID(userId);
	    Long lastUpdateDate = db.getLastSyncTime();
	    Cursor localData = db.getItemsAfterDate(lastUpdateDate);

	    if (null != localData) {
	      for (boolean isDataExist = localData.moveToFirst(); isDataExist; isDataExist = localData
	          .moveToNext()) {
	        request.addObject(localData);
	      }
	    }
	}
	
	private void updateLocalKeys(JSONObject data) {
	    Log.i(TAG, "Update local data with server keys.");
	    Iterator<Map.Entry<String, String>> items = request.addKeys(data)
	        .entrySet().iterator();
	    while (items.hasNext()) {
	      Map.Entry<String, String> item = items.next();
	      String key = (String) item.getKey();
	      String value = (String) item.getValue();
	      Log.d(TAG, "Update local data with key:(" + key + "," + value + ")");
	      db.setRecordKey(key, value);
	    }
	    sendItems();
	}
	
	public void sendItems() {
	    final ArrayList<NameValuePair> params = new ArrayList<NameValuePair>();
	    JSONObject req = request.getNext();
	    try {
	      if (req != null) {
	        String reqString = req.toString();
	        Log.i(TAG, "Send comment.");
	        Log.d(TAG, "request data: " + reqString);
	        params.add(new BasicNameValuePair(SyncAdapter.JSON_REQUEST_PARAM_NAME,
	            req.toString()));
	        getHttpConnector().sendRequest("/sync", params,
	            new IHttpRequestHandler() {
	              public void onRequest(JSONObject response) {
	                if (response != null) {
	                  Log.d(TAG, "Send Comment response: " + response.toString());
	                  db.updateLastSyncTime(System.currentTimeMillis());
	                }
	                sendItems();
	              }
	            });
	      }
	    } catch (IOException e) {
	      Log.e(TAG, e.getMessage(), e);
	    }
	}
	
	/**
	 * @return the httpConnector
	 */
	public HttpConnector getHttpConnector() {
		if (httpConnector == null) {
	      httpConnector = new HttpConnector(getContext());
	    }
	    return httpConnector;
	}

}
