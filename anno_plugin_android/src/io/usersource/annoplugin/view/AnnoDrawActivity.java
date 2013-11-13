package io.usersource.annoplugin.view;

import android.app.ActivityManager;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.gesture.GestureOverlayView;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Log;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import io.usersource.annoplugin.AnnoPlugin;
import io.usersource.annoplugin.R;
import io.usersource.annoplugin.datastore.TableCommentFeedbackAdapter;
import io.usersource.annoplugin.utils.*;
import org.apache.cordova.DroidGap;
import org.json.JSONArray;

import java.io.*;
import java.util.List;
import java.util.UUID;

public class AnnoDrawActivity extends DroidGap
{
  private boolean isPractice;
  private int level;
  private String screenshotPath;
  private static final int COMPRESS_QUALITY = 40;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    super.init();
    appView.addJavascriptInterface(this, "ADActivity");

    super.loadUrl("file:///android_asset/www/pages/annodraw/main.html");

    Intent intent = getIntent();
    level = intent.getIntExtra(PluginUtils.LEVEL, 0);

    handleIntent();
  }

  public int getLevel() {
    return level;
  }

  private void handleIntent() {
    Intent intent = getIntent();
    String action = intent.getAction();
    String type = intent.getType();

    if (Intent.ACTION_SEND.equals(action) && type != null) {
      if (type.startsWith("image/")) {
        handleFromShareImage(intent);
      }
    }
  }

  private void handleFromShareImage(Intent intent)
  {
    this.screenshotPath = "";
    this.level = intent.getIntExtra(PluginUtils.LEVEL, 0) + 1;
    this.isPractice = intent.getBooleanExtra(
            Constants.INTENT_EXTRA_IS_PRACTICE, false);

    Log.d(TAG, "current level:" + this.level);
    if (this.level == 2) {
      //red color
    }

    Uri imageUri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
    String realUrl = getRealPathFromURI(this, imageUri);


    if (imageUri != null)
    {
      ContentResolver rc = this.getContentResolver();
      BitmapDrawable drawable;
      try {
        drawable = new BitmapDrawable(getResources(),
                rc.openInputStream(imageUri));
        if (ImageUtils.IMAGE_ORIENTATION_LANDSCAPE.equals(ImageUtils
                .isLandscapeOrPortrait(drawable))) {
          drawable = ImageUtils.rotateImage(drawable, 90);

          Bitmap bmp = drawable.getBitmap();
          FileOutputStream fos = new FileOutputStream(realUrl);
          bmp.compress(Bitmap.CompressFormat.PNG, 100, fos);

          this.screenshotPath = realUrl;
          fos.flush();
          fos.close();
        }
        else
        {
          this.screenshotPath = realUrl;
        }
      } catch (Exception e) {
        Log.e(TAG, e.getMessage(), e);
      }
    }

  }

  public String getRealPathFromURI(Context context, Uri contentUri) {
    Cursor cursor = null;
    try {
      String[] proj = { MediaStore.Images.Media.DATA };
      cursor = context.getContentResolver().query(contentUri,  proj, null, null, null);
      int column_index = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
      cursor.moveToFirst();
      return cursor.getString(column_index);
    } finally {
      if (cursor != null) {
        cursor.close();
      }
    }
  }

  @JavascriptInterface
  public String getScreenshotPath()
  {
    return screenshotPath;
  }

  @JavascriptInterface
  public String saveImage() throws IOException
  {
    AppConfig config = AppConfig.getInstance(this);

    String appLocation = config.getDataLocation();
    String screenshotDirName = config.getScreenshotDirName();
    String screenshotDirPath = new File(appLocation, screenshotDirName)
            .getAbsolutePath();
    SystemUtils.mkdirs(this, screenshotDirPath);
    //checkEnoughSpace(bitmap.getByteCount());

    String imageKey = generateUniqueImageKey();
    FileOutputStream out = new FileOutputStream(new File(screenshotDirPath,
            imageKey));

    ContentResolver rc = this.getContentResolver();
    BitmapDrawable drawable;
    drawable = new BitmapDrawable(new FileInputStream(screenshotPath));

    Bitmap bmp = drawable.getBitmap();
    bmp.compress(Bitmap.CompressFormat.PNG, COMPRESS_QUALITY, out);

    return imageKey+","+screenshotDirPath;
  }

  private String generateUniqueImageKey() {
    return UUID.randomUUID().toString();
  }

  @JavascriptInterface
  public String getAppNameAndSource() throws Exception
  {
    String source, appName, appVersion, retValue;
    if (PluginUtils.isAnno(getPackageName()) && this.level != 2) {
      source = Constants.ANNO_SOURCE_STANDALONE;
      appName = Constants.UNKNOWN_APP_NAME;
    } else {
      source = Constants.ANNO_SOURCE_PLUGIN;
      appName = SystemUtils.getAppName(AnnoDrawActivity.this);
    }

    appVersion = SystemUtils.getAppVersion(AnnoDrawActivity.this);

    retValue = "[\""+source+"\",\""+appName+"\",\""+appVersion+"\",\""+getLevel()+"\"]";

    return retValue;
  }

  @JavascriptInterface
  public String getRecentTasks(int taskNum)
  {
    ActivityManager mActivityManager = (ActivityManager)getSystemService(Context.ACTIVITY_SERVICE);
    // Print Recent Running Tasks
    JSONArray jsonArray = new JSONArray();
    List<ActivityManager.RecentTaskInfo> recentTasks = mActivityManager.getRecentTasks(
            taskNum, ActivityManager.RECENT_IGNORE_UNAVAILABLE);
    for (ActivityManager.RecentTaskInfo rti : recentTasks) {
      Intent intent = rti.baseIntent;
      ResolveInfo resolveInfo = this.getPackageManager().resolveActivity(
              intent, 0);

      jsonArray.put(resolveInfo.loadLabel(this.getPackageManager()).toString());
    }

    return jsonArray.toString();
  }
}
