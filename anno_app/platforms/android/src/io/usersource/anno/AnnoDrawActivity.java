package io.usersource.anno;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.gesture.GestureOverlayView;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.BitmapDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import io.usersource.annoplugin.utils.*;
import org.apache.cordova.DroidGap;

import java.io.*;

public class AnnoDrawActivity extends DroidGap
{
  private boolean isPractice;
  private boolean editMode;
  private int level;
  private String screenshotPath;
  private String appName;
  private String drawElementsJson;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    super.init();

    /**
     * spiral gesture support start
     */
    GestureOverlayView view = new GestureOverlayView(this);
    view.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.MATCH_PARENT, 1));

    setContentView(view);
    view.addView((View) appView.getParent()); // adds the PhoneGap browser
    view.getChildAt(0).setLayoutParams(
            new FrameLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT, 1));

    setContentView(view);
    view.setGestureVisible(false);
    /**
     * spiral gesture support end
     */

    super.loadUrl("file:///android_asset/www/anno/pages/annodraw/main.html");

    Intent intent = getIntent();
    level = intent.getIntExtra(AnnoUtils.LEVEL, 0);

    handleIntent();
  }

  public int getLevel() {
    return level;
  }

  public View getAppView()
  {
    return this.appView;
  }

  private void handleIntent()
  {
    Intent intent = getIntent();
    String action = intent.getAction();
    String type = intent.getType();

    if (Intent.ACTION_SEND.equals(action) && type != null)
    {
      if (type.startsWith("image/"))
      {
        if (intent.getBooleanExtra(AnnoUtils.EDIT_ANNO_MODE, false))
        {
          this.editMode = true;
          handleEditAnnoData(intent);
        }
        else
        {
          this.editMode = false;
          handleFromShareImage(intent);
        }
      }
    }
  }

  private void handleEditAnnoData(Intent intent)
  {
    this.screenshotPath = intent.getStringExtra(AnnoUtils.IMAGE_DATAURL);
    this.level = intent.getIntExtra(AnnoUtils.LEVEL, 0);
    this.appName = intent.getStringExtra(AnnoUtils.APP_NAME);
    this.drawElementsJson = intent.getStringExtra(AnnoUtils.DRAW_ELEMENTS_JSON);
  }

  private void handleFromShareImage(Intent intent)
  {
    this.screenshotPath = "";
    this.level = intent.getIntExtra(AnnoUtils.LEVEL, 0) + 1;
    this.isPractice = intent.getBooleanExtra(
            AnnoUtils.INTENT_EXTRA_IS_PRACTICE, false);

    if (AnnoUtils.debugEnabled) {
      Log.d(TAG, "current level:" + this.level);
    }

    Uri imageUri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
    String realUrl = AnnoUtils.getFilePathByURI(this, imageUri);


    if (imageUri != null)
    {
      ContentResolver rc = this.getContentResolver();
      BitmapDrawable drawable;
      try {
        drawable = new BitmapDrawable(getResources(),
                rc.openInputStream(imageUri));
        if (AnnoUtils.IMAGE_ORIENTATION_LANDSCAPE.equals(AnnoUtils
                .isLandscapeOrPortrait(drawable))) {
          drawable = AnnoUtils.rotateImage(drawable, 90);

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
        if (AnnoUtils.debugEnabled) {
          Log.e(TAG, e.getMessage(), e);
        }
      }
    }

  }

  public String getScreenshotPath()
  {
    return screenshotPath;
  }

  public String getAppName()
  {
    return appName;
  }

  public String getDrawElementsJson()
  {
    return drawElementsJson;
  }

  public boolean isEditMode()
  {
    return editMode;
  }
}
