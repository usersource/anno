package io.usersource.annoplugin.datastore;

import java.util.ArrayList;
import java.util.List;

/**
 * Table adapter for anno users
 * 
 * @author Sergey Gadzhilov
 */

import android.content.ContentValues;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public class TableUsers extends AbstractTableAdapter {
	
	public static final String TABLE_NAME = "anno_users";
	
	public static final String COL_ID = "_id";
	public static final String COL_USER_ID = "user_id";
	public static final String COL_DISPLAY_ID = "display_id";
	

	public TableUsers(SQLiteOpenHelper sqliteOpenHelper) {
		super(sqliteOpenHelper);
	}

	@Override
	public long insert(ContentValues values) {
		SQLiteDatabase database = sqliteOpenHelper.getWritableDatabase();
	    return database.insert(getTableName(), null, values);
	}

	@Override
	public String getTableName() {
		return TABLE_NAME;
	}

	@Override
	public List<String> getInitSqls() {
		String createTableSql = String
		        .format( "create table %s " +
		        		 "(%s integer primary key autoincrement, " +
		        		 "%s text not null," +
		        		 "%s text not null);",
		            TABLE_NAME, COL_ID, COL_USER_ID, COL_DISPLAY_ID);
		List<String> initSqls = new ArrayList<String>();
	    initSqls.add(createTableSql);
		return initSqls;
	}

}
