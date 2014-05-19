package io.usersource.anno;

import android.content.res.AssetFileDescriptor;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import io.usersource.annoplugin.utils.AnnoUtils;

import org.apache.cordova.DroidGap;

import android.content.Intent;
import android.gesture.GestureOverlayView;
import android.os.Bundle;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import java.io.File;

/**
 * Community html5 entry activity. This activity launch html5 pages on create.
 * 
 * @author topcircler
 * 
 */
public class CommunityActivity extends DroidGap {

  private int level;

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
    AnnoUtils.setEnableGesture(this, view, true);
    /**
     * spiral gesture support end
     */

    super.loadUrl("file:///android_asset/www/anno/pages/community/main.html");
    //WebView.setWebContentsDebuggingEnabled(true);
    Intent intent = getIntent();
    level = intent.getIntExtra(AnnoUtils.LEVEL, 0);
  }

  public int getLevel() {
    return level;
  }

  public View getAppView()
  {
    return this.appView;
  }
}
