package io.usersource.annoplugin.sync;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

/**
 * Service to handle Account sync.
 * This is invoked with an intent with action ACTION_AUTHENTICATOR_INTENT. 
 * It instantiates the sync adapter and returns its IBinder.
 * 
 * @author Sergey Gadzhilov
 */
public class SyncService extends Service 
{
	private static final String TAG = "AnnoSynchService";
	
    private static final Object sSyncAdapterLock = new Object();
    private static SyncAdapter sSyncAdapter = null;

    /**
     * {@inheritDoc}
     */
    @Override
    public void onCreate() 
    {
    	Log.v(TAG, "Synchronization Service started.");
        synchronized (sSyncAdapterLock) 
        {
            if (sSyncAdapter == null) 
            {
                sSyncAdapter = new SyncAdapter(getApplicationContext(), true);
            }
        }
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    public void onDestroy() 
    {
    	Log.v(TAG, "Synchronization Service stoped.");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public IBinder onBind(Intent intent) 
    {
    	Log.v(TAG, "getSyncAdapterBinder() returning the SyncAdapter binder for intent " + intent);
        return sSyncAdapter.getSyncAdapterBinder();
    }
}
