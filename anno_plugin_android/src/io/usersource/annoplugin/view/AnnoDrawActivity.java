package io.usersource.annoplugin.view;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.gesture.GestureOverlayView;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Log;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import io.usersource.annoplugin.AnnoPlugin;
import io.usersource.annoplugin.utils.*;
import org.apache.cordova.DroidGap;

import java.io.*;

public class AnnoDrawActivity extends DroidGap
{
  private boolean isPractice;
  private int level;
  private String screenshotPath;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    super.init();

    GestureOverlayView view = new GestureOverlayView(this);
    view.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.MATCH_PARENT, 1));

    setContentView(view);
    view.addView((View) appView.getParent());
    view.getChildAt(0).setLayoutParams(
            new FrameLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT, 1));

    setContentView(view);
    AnnoPlugin.setEnableGesture(this, view, true);

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
      // todo red color
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

    if (contentUri.toString().startsWith("file://"))
    {
      return contentUri.getPath();
    }

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

  public String getScreenshotPath()
  {
    return screenshotPath;
  }
}
