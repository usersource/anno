package io.usersource.annoplugin.sync;

import io.usersource.annoplugin.datastore.FileImageManage;
import io.usersource.annoplugin.datastore.TableCommentFeedbackAdapter;
import io.usersource.annoplugin.utils.AppConfig;
import io.usersource.annoplugin.utils.Constants;

import java.util.HashMap;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.database.Cursor;
import android.util.Log;

public class RequestCreater {

  private static final String TAG = "RequestCreater";

  // json data property to sync with server.
  public static final String JSON_CLIENT_ID = "client_id";
  public static final String JSON_COMMENT = "comment";
  public static final String JSON_SCREEN_KEY = "screenshot_key";
  public static final String JSON_X = "x";
  public static final String JSON_Y = "y";
  public static final String JSON_DIRECTION = "direction";
  public static final String JSON_APP_VERSION = "app_version";
  public static final String JSON_OS_VERSION = "os_version";
  public static final String JSON_IS_MOVED = "isMoved";
  public static final String JSON_LEVEL = "level";
  public static final String JSON_APP_NAME = "app_name";
  public static final String JSON_MODEL = "model";
  public static final String JSON_ANNO_TYPE = "anno_type";

  public static final String JSON_UPDATED_OBJECTS = "updatedObjects";
  public static final String JSON_TIME_STAMP = "lastUpdateDate";
  public static final String JSON_OBJECT_KEY = "object_key";
  public static final String JSON_KEYS_COUNT = "keys_count";
  public static final String JSON_USER_ID = "user_id";
  
  public static final String JSON_REQUEST_TYPE = "request_type";
  public static final String JSON_REQUEST_TYPE_KEYS = "generateKeys";
  public static final String JSON_REQUEST_TYPE_UPDATE = "updateData";
  public static final String JSON_REQUEST_TYPE_SERVER_DATA = "getServerData";

  public static final String JSON_IMAGE = "image";

  public static final String JSON_OBJECTS_KEYS = "objectsKeys";
  

  int keysCount;
  int currentItem;

  JSONObject request;
  JSONObject keysRequest;
  JSONArray objects;

  String requestTimestamp;
  String userID;

  Context context;

  public RequestCreater(Context ctx) {
    keysCount = 0;
    currentItem = 0;
    context = ctx;
    request = new JSONObject();
    keysRequest = new JSONObject();
    objects = new JSONArray();
  }

  public void addObject(Cursor data) {
    JSONObject object = new JSONObject();

    try {
      object.put(JSON_CLIENT_ID, data.getString(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_ID)));
      object.put(JSON_COMMENT, data.getString(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_COMMENT)));
      object.put(JSON_SCREEN_KEY, data.getString(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_SCREENSHOT_KEY)));
      object.put(JSON_X, data.getString(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_POSITION_X)));
      object.put(JSON_Y, data.getString(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_POSITION_Y)));
      object.put(JSON_DIRECTION, data.getString(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_DIRECTION)));
      object.put(JSON_APP_VERSION, data.getString(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_APP_VERSION)));
      object.put(JSON_OS_VERSION, data.getString(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_OS_VERSION)));
      object.put(JSON_IS_MOVED, data.getInt(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_MOVED)));
      object.put(JSON_LEVEL, data.getInt(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_LEVEL)));
      object.put(JSON_TIME_STAMP, data.getString(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_TIMESTAMP)));
      object.put(JSON_ANNO_TYPE, Constants.DEFAULT_ANNO_TYPE);
      object.put(JSON_APP_NAME, data.getString(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_APP_NAME)));
      object.put(JSON_MODEL, data.getString(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_MODEL)));

      if (data.getString(data
          .getColumnIndex(TableCommentFeedbackAdapter.COL_OBJECT_KEY)) == null) {
        object.put(JSON_OBJECT_KEY, JSONObject.NULL);
        ++keysCount;
      } else {
        object.put(JSON_OBJECT_KEY, data.getString(data
            .getColumnIndex(TableCommentFeedbackAdapter.COL_OBJECT_KEY)));
      }
      objects.put(object);
    } catch (JSONException e) {
      Log.e(TAG, e.getMessage(), e);
    }
  }

  public Map<String, String> addKeys(JSONObject data) {
    Map<String, String> result = null;
    try {
      result = new HashMap<String, String>(data.getInt(JSON_KEYS_COUNT));
      for (int i = 0, j = 0; j < data.getJSONArray(JSON_OBJECTS_KEYS).length(); ++i) {
        if (objects.getJSONObject(i).getString(JSON_OBJECT_KEY).equals("null")) {
          objects.getJSONObject(i).put(JSON_OBJECT_KEY,
              data.getJSONArray(JSON_OBJECTS_KEYS).getString(j));
          result.put(objects.getJSONObject(i).getString(JSON_CLIENT_ID), data
              .getJSONArray(JSON_OBJECTS_KEYS).getString(j));
          ++j;
        }
      }
    } catch (JSONException e) {
      Log.e(TAG, e.getMessage(), e);
    }
    return result;
  }
  
  public void setUserID(String id)
  {
	  userID = id;
  }

  public JSONObject getRequest() {
    try {
      request.put(JSON_UPDATED_OBJECTS, objects);
      request.put(JSON_REQUEST_TYPE, JSON_REQUEST_TYPE_UPDATE);
      if(!userID.isEmpty())
      {
    	  request.put(JSON_USER_ID, userID);
      }
    } catch (JSONException e) {
      Log.e(TAG, e.getMessage(), e);
    }
    return request;
  }

  /**
   * This method returns request for generate keys
   * 
   * @return request for generate keys
   */
  public JSONObject getKeysRequest() {
    try {
      keysRequest.put(JSON_KEYS_COUNT, keysCount);
      keysRequest.put(JSON_REQUEST_TYPE, JSON_REQUEST_TYPE_KEYS);
    } catch (JSONException e) {
      Log.e(TAG, e.getMessage(), e);
    }
    return keysRequest;
  }

  public JSONObject getNext() {
    JSONObject result = null;
    if (currentItem < objects.length()) {
      result = new JSONObject();
      try {
        JSONObject item = objects.getJSONObject(currentItem);

        FileImageManage imageManager = new FileImageManage(context,
            AppConfig.getInstance(context));
        String imageKey = item.getString(JSON_SCREEN_KEY);
        // long imageSize = imageManager.imageSize(imageKey);
        item.put(JSON_IMAGE, imageManager.compressImage(imageKey));

        if(!userID.isEmpty())
        {
        	item.put(JSON_USER_ID, userID);
        }
        result.put(JSON_UPDATED_OBJECTS, item);
        result.put(JSON_REQUEST_TYPE, JSON_REQUEST_TYPE_UPDATE);
        Log.d(TAG, "getNext:" + result.toString(2));
        ++currentItem;
      } catch (JSONException e) {
        Log.e(TAG, e.getMessage(), e);
      }
    }
    return result;
  }
}
