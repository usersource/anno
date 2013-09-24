package io.usersource.annoplugin.sync;

import io.usersource.annoplugin.datastore.TableUsers;
import io.usersource.annoplugin.model.AnnoContentProvider;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.util.Log;

public class UsersManager {

	private static final String TAG = UsersManager.class.getSimpleName();
	private ContentResolver dbContext;
	private String mUserId = null;
	
	public UsersManager(Context context) {
		dbContext = context.getContentResolver();
	}
	
	public String getUserID()
	{
		if(mUserId == null )
		{
			Cursor users = dbContext.query(AnnoContentProvider.USERS_PATH_URI, null, null, null, null);
			if(users != null && users.moveToFirst())
			{
				mUserId = users.getString(users.getColumnIndex(TableUsers.COL_USER_ID));
			}
		}
		return mUserId;
	}
	
	public void createNewUser(ContentValues user)
	{
		if(dbContext.insert(AnnoContentProvider.USERS_PATH_URI, user) == null){
			Log.v(TAG, "Error when try to create a new local user");
		}
	}

}
