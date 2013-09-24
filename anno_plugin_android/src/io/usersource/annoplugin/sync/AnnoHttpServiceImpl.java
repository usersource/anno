package io.usersource.annoplugin.sync;

import io.usersource.annoplugin.network.HttpConnector;
import io.usersource.annoplugin.network.IHttpRequestHandler;
import io.usersource.annoplugin.utils.SystemUtils;

import java.io.IOException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.apache.http.NameValuePair;
import org.apache.http.ParseException;
import org.apache.http.message.BasicNameValuePair;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.util.Base64;
import android.util.Log;

/**
 * Http implementation of anno services.
 * 
 * @author topcircler
 * 
 */
public class AnnoHttpServiceImpl implements AnnoHttpService {

  /** community context path. */
  private static final String BASE_URL_COMMUNITY = "/community";
  private static final String TAG = AnnoHttpServiceImpl.class.getSimpleName();

  private HttpConnector httpConnector;
  private Context context;
  private UsersManager mUser;

  public AnnoHttpServiceImpl(Context context) {
    this.context = context;
    httpConnector = new HttpConnector(context);
    mUser = new UsersManager(context);
  }

  /**
   * Common http response handler implementation.
   * 
   * @author topcircler
   * 
   */
  private class AnnoResponseHandler implements IHttpRequestHandler {

    private ResponseHandler handler;

    public AnnoResponseHandler(ResponseHandler handler) {
      this.handler = handler;
    }

    @Override
    public void onRequest(JSONObject response) {
      handler.handleResponse(response);
    }

  }

  private void execute(final IHttpExecution execution,
      final Map<String, Object> input, ResponseHandler handler) {
    if (!SystemUtils.isOnline(context)) {
      Log.i(TAG, "Device is offline, won't synchronize.");
      Exception e = new Exception("No network connectivity.");
      handler.handleError(e);
      return;
    }
    execution.execute(input);
  }

  @Override
  public void getAnnoList(long offset, long limit,
      final ResponseHandler respHandler) {
    IHttpExecution execution = new IHttpExecution() {

      @Override
      public void execute(Map<String, Object> input) {
        try {
          Long offset = (Long) input.get("offset");
          Long limit = (Long) input.get("limit");
          String reqUrl = String.format("%s?offset=%d&limit=%d",
              BASE_URL_COMMUNITY, offset, limit);
          httpConnector.sendRequest(reqUrl, null, new AnnoResponseHandler(
              respHandler));
        } catch (ParseException e) {
          respHandler.handleError(e);
        } catch (IOException e) {
          respHandler.handleError(e);
        }
      }

    };
    final Map<String, Object> input = new HashMap<String, Object>();
    input.put("offset", offset);
    input.put("limit", limit);
    this.execute(execution, input, respHandler);
  }

  @Override
  public void getAnnoDetail(String annoId, final ResponseHandler respHandler) {
    IHttpExecution execution = new IHttpExecution() {

      @Override
      public void execute(Map<String, Object> input) {
        try {
          String annoId = (String) input.get("anno_id");
          String reqUrl = String.format("%s?anno_id=%s&user_id=%s", BASE_URL_COMMUNITY,
              annoId, mUser.getUserID());
          httpConnector.sendRequest(reqUrl, null, new ImageResponseHandler(
              respHandler));
        } catch (ParseException e) {
          respHandler.handleError(e);
        } catch (IOException e) {
          respHandler.handleError(e);
        }
      }

    };
    final Map<String, Object> input = new HashMap<String, Object>();
    input.put("anno_id", annoId);
    this.execute(execution, input, respHandler);
  }

  private class ImageResponseHandler implements IHttpRequestHandler {

    private ResponseHandler handler;

    public ImageResponseHandler(ResponseHandler handler) {
      this.handler = handler;
    }

    @Override
    public void onRequest(JSONObject response) {
      JSONObject obj;
      String screenshot = null;
      try {
        obj = response.getJSONObject("anno");
        screenshot = obj.getString("screenshot");
        // android side will use Base64(url_safe) to encode image data and send
        // to gae server.
        // on html5 side, it only decodes Base64(default) and render the image.
        // hence here, we decode it using Base64(url_safe) and then encode it
        // using Base64(default) and pass to html5.
        byte[] imageData = Base64.decode(screenshot, Base64.URL_SAFE);
        String newScreenshot = Base64.encodeToString(imageData, Base64.DEFAULT);
        obj.put("screenshot", newScreenshot);
        handler.handleResponse(response);
      } catch (JSONException e1) {
        handler.handleError(e1);
      }
    }

  }

  @Override
  public void updateAppName(String annoId, String appName,
      final ResponseHandler respHandler) {
    IHttpExecution execution = new IHttpExecution() {

      @Override
      public void execute(Map<String, Object> input) {
        try {
          String annoId = (String) input.get("anno_id");
          String appName = (String) input.get("app_name");
          String reqUrl = String.format("%s?anno_id=%s&setName=%s",
              BASE_URL_COMMUNITY, annoId, URLEncoder.encode(appName, "UTF-8"));
          httpConnector.sendRequest(reqUrl, null, new AnnoResponseHandler(
              respHandler));
        } catch (ParseException e) {
          respHandler.handleError(e);
        } catch (IOException e) {
          respHandler.handleError(e);
        }
      }

    };
    final Map<String, Object> input = new HashMap<String, Object>();
    input.put("anno_id", annoId);
    input.put("app_name", appName);
    this.execute(execution, input, respHandler);
  }

  private interface IHttpExecution {
    void execute(Map<String, Object> input);
  }

  @Override
  public void addFollowup(String annoId, String comment,
      final ResponseHandler respHandler) {
    IHttpExecution execution = new IHttpExecution() {

      @Override
      public void execute(Map<String, Object> input) {
        try {
          String annoId = (String) input.get("anno_id");
          String comment = (String) input.get("comment");
          JSONObject jsonData = new JSONObject();
          jsonData.put("type", "followup");
          jsonData.put("action", "add");
          jsonData.put("feedback_key", annoId);
          jsonData.put("comment", comment);
          jsonData.put("user_id", mUser.getUserID());

          final ArrayList<NameValuePair> params = new ArrayList<NameValuePair>();
          params
              .add(new BasicNameValuePair("jsonRequest", jsonData.toString()));
          httpConnector.sendRequest(BASE_URL_COMMUNITY, params,
              new AnnoResponseHandler(respHandler));
        } catch (ParseException e) {
          respHandler.handleError(e);
        } catch (IOException e) {
          respHandler.handleError(e);
        } catch (JSONException e) {
          respHandler.handleError(e);
        }
      }

    };
    final Map<String, Object> input = new HashMap<String, Object>();
    input.put("anno_id", annoId);
    input.put("comment", comment);
    this.execute(execution, input, respHandler);
  }

  @Override
  public void addFlag(String annoId, final ResponseHandler respHandler) {
    IHttpExecution execution = new IHttpExecution() {

      @Override
      public void execute(Map<String, Object> input) {
        try {
          String annoId = (String) input.get("anno_id");
          JSONObject jsonData = new JSONObject();
          jsonData.put("type", "Flag");
          jsonData.put("action", "add");
          jsonData.put("feedback_key", annoId);
          jsonData.put("user_id", mUser.getUserID());

          final ArrayList<NameValuePair> params = new ArrayList<NameValuePair>();
          params
              .add(new BasicNameValuePair("jsonRequest", jsonData.toString()));
          httpConnector.sendRequest(BASE_URL_COMMUNITY, params,
              new AnnoResponseHandler(respHandler));
        } catch (ParseException e) {
          respHandler.handleError(e);
        } catch (IOException e) {
          respHandler.handleError(e);
        } catch (JSONException e) {
          respHandler.handleError(e);
        }
      }

    };
    final Map<String, Object> input = new HashMap<String, Object>();
    input.put("anno_id", annoId);
    this.execute(execution, input, respHandler);
  }

  @Override
  public void addVote(String annoId, final ResponseHandler respHandler) {
    IHttpExecution execution = new IHttpExecution() {

      @Override
      public void execute(Map<String, Object> input) {
        try {
          String annoId = (String) input.get("anno_id");
          JSONObject jsonData = new JSONObject();
          jsonData.put("type", "Vote");
          jsonData.put("action", "add");
          jsonData.put("feedback_key", annoId);
          jsonData.put("user_id", mUser.getUserID());

          final ArrayList<NameValuePair> params = new ArrayList<NameValuePair>();
          params
              .add(new BasicNameValuePair("jsonRequest", jsonData.toString()));
          httpConnector.sendRequest(BASE_URL_COMMUNITY, params,
              new AnnoResponseHandler(respHandler));
        } catch (ParseException e) {
          respHandler.handleError(e);
        } catch (IOException e) {
          respHandler.handleError(e);
        } catch (JSONException e) {
          respHandler.handleError(e);
        }
      }

    };
    final Map<String, Object> input = new HashMap<String, Object>();
    input.put("anno_id", annoId);
    this.execute(execution, input, respHandler);
  }

  @Override
  public void countVote(String annoId, final ResponseHandler respHandler) {
    IHttpExecution execution = new IHttpExecution() {

      @Override
      public void execute(Map<String, Object> input) {
        try {
          String annoId = (String) input.get("anno_id");
          JSONObject jsonData = new JSONObject();
          jsonData.put("feedback_key", annoId);
          jsonData.put("type", "getVotesCount");
          jsonData.put("user_id", mUser.getUserID());

          final ArrayList<NameValuePair> params = new ArrayList<NameValuePair>();
          params
              .add(new BasicNameValuePair("jsonRequest", jsonData.toString()));
          httpConnector.sendRequest(BASE_URL_COMMUNITY, params,
              new AnnoResponseHandler(respHandler));
        } catch (ParseException e) {
          respHandler.handleError(e);
        } catch (IOException e) {
          respHandler.handleError(e);
        } catch (JSONException e) {
          respHandler.handleError(e);
        }
      }

    };
    final Map<String, Object> input = new HashMap<String, Object>();
    input.put("anno_id", annoId);
    this.execute(execution, input, respHandler);
  }

  @Override
  public void countFlag(String annoId, final ResponseHandler respHandler) {
    IHttpExecution execution = new IHttpExecution() {

      @Override
      public void execute(Map<String, Object> input) {
        try {
          String annoId = (String) input.get("anno_id");
          JSONObject jsonData = new JSONObject();
          jsonData.put("feedback_key", annoId);
          jsonData.put("type", "getFlagsCount");
          jsonData.put("user_id", mUser.getUserID());

          final ArrayList<NameValuePair> params = new ArrayList<NameValuePair>();
          params
              .add(new BasicNameValuePair("jsonRequest", jsonData.toString()));
          httpConnector.sendRequest(BASE_URL_COMMUNITY, params,
              new AnnoResponseHandler(respHandler));
        } catch (ParseException e) {
          respHandler.handleError(e);
        } catch (IOException e) {
          respHandler.handleError(e);
        } catch (JSONException e) {
          respHandler.handleError(e);
        }
      }

    };
    final Map<String, Object> input = new HashMap<String, Object>();
    input.put("anno_id", annoId);
    this.execute(execution, input, respHandler);
  }

  @Override
  public void removeFlag(String annoId, final ResponseHandler respHandler) {
    IHttpExecution execution = new IHttpExecution() {

      @Override
      public void execute(Map<String, Object> input) {
        try {
          String annoId = (String) input.get("anno_id");
          JSONObject jsonData = new JSONObject();
          jsonData.put("feedback_key", annoId);
          jsonData.put("type", "Flag");
          jsonData.put("action", "delete");
          jsonData.put("user_id", mUser.getUserID());

          final ArrayList<NameValuePair> params = new ArrayList<NameValuePair>();
          params
              .add(new BasicNameValuePair("jsonRequest", jsonData.toString()));
          httpConnector.sendRequest(BASE_URL_COMMUNITY, params,
              new AnnoResponseHandler(respHandler));
        } catch (ParseException e) {
          respHandler.handleError(e);
        } catch (IOException e) {
          respHandler.handleError(e);
        } catch (JSONException e) {
          respHandler.handleError(e);
        }
      }

    };
    final Map<String, Object> input = new HashMap<String, Object>();
    input.put("anno_id", annoId);
    this.execute(execution, input, respHandler);
  }

  @Override
  public void removeVote(String annoId, final ResponseHandler respHandler) {
    IHttpExecution execution = new IHttpExecution() {

      @Override
      public void execute(Map<String, Object> input) {
        try {
          String annoId = (String) input.get("anno_id");
          JSONObject jsonData = new JSONObject();
          jsonData.put("feedback_key", annoId);
          jsonData.put("type", "Vote");
          jsonData.put("action", "delete");
          jsonData.put("user_id", mUser.getUserID());

          final ArrayList<NameValuePair> params = new ArrayList<NameValuePair>();
          params
              .add(new BasicNameValuePair("jsonRequest", jsonData.toString()));
          httpConnector.sendRequest(BASE_URL_COMMUNITY, params,
              new AnnoResponseHandler(respHandler));
        } catch (ParseException e) {
          respHandler.handleError(e);
        } catch (IOException e) {
          respHandler.handleError(e);
        } catch (JSONException e) {
          respHandler.handleError(e);
        }
      }

    };
    final Map<String, Object> input = new HashMap<String, Object>();
    input.put("anno_id", annoId);
    this.execute(execution, input, respHandler);
  }

  @Override
  public void removeFollowup(String followUpId,
      final ResponseHandler respHandler) {
    IHttpExecution execution = new IHttpExecution() {

      @Override
      public void execute(Map<String, Object> input) {
        try {
          String followupId = (String) input.get("followup_id");
          JSONObject jsonData = new JSONObject();
          jsonData.put("followup_key", followupId);
          jsonData.put("type", "followup");
          jsonData.put("action", "delete");
          jsonData.put("user_id", mUser.getUserID());

          final ArrayList<NameValuePair> params = new ArrayList<NameValuePair>();
          params
              .add(new BasicNameValuePair("jsonRequest", jsonData.toString()));
          httpConnector.sendRequest(BASE_URL_COMMUNITY, params,
              new AnnoResponseHandler(respHandler));
        } catch (ParseException e) {
          respHandler.handleError(e);
        } catch (IOException e) {
          respHandler.handleError(e);
        } catch (JSONException e) {
          respHandler.handleError(e);
        }
      }

    };
    final Map<String, Object> input = new HashMap<String, Object>();
    input.put("followup_id", followUpId);
    this.execute(execution, input, respHandler);
  }

}
