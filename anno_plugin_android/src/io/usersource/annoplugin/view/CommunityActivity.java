package io.usersource.annoplugin.view;

import android.util.Log;
import android.view.KeyEvent;
import android.webkit.JavascriptInterface;
import io.usersource.annoplugin.AnnoPlugin;
import io.usersource.annoplugin.utils.PluginUtils;

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
  private boolean backButtonEnable = true;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    super.init();

    File database=getApplicationContext().getDatabasePath("anno.db");

    if (!database.exists())
    {
      Intent intent = new Intent(this, IntroActivity.class);
      startActivity(intent);
    }

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
    AnnoPlugin.setEnableGesture(this, view, true);


    this.appView.setOnKeyListener(new View.OnKeyListener() {

      public boolean onKey(View v, int keyCode, KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_UP) {
          if (keyCode == KeyEvent.KEYCODE_BACK) {
            // Do Stuff Here
            if (CommunityActivity.this.isBackButtonEnable())
            {
              return onKeyUp(keyCode, event);
            }
            else
            {
              CommunityActivity.this.sendJavascript("javascript:window.hideTrayScreen()");
              return true;
            }
          }
          return onKeyUp(keyCode, event);
        }
        return onKeyDown(keyCode, event);
      }
    });

    appView.addJavascriptInterface(this, "CMActivity");

    super.loadUrl("file:///android_asset/www/pages/community/main.html");

    Intent intent = getIntent();
    level = intent.getIntExtra(PluginUtils.LEVEL, 0);

  }

  public int getLevel() {
    return level;
  }

  @JavascriptInterface
  public void enableBackButton()
  {
    backButtonEnable = true;
  }

  @JavascriptInterface
  public void disableBackButton()
  {
    backButtonEnable = false;
  }

  public boolean isBackButtonEnable()
  {
    return backButtonEnable;
  }
}
