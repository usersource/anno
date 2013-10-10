package io.usersource.annoplugin.view;

import android.content.Intent;
import android.gesture.GestureOverlayView;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import io.usersource.annoplugin.AnnoPlugin;
import io.usersource.annoplugin.utils.PluginUtils;
import org.apache.cordova.DroidGap;

import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;

public class IntroActivity extends DroidGap {
  private int level;

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

    this.appView.setOnKeyListener(new View.OnKeyListener() {

      public boolean onKey(View v, int keyCode, KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_UP) {
          if (keyCode == KeyEvent.KEYCODE_BACK) {
            // Do Stuff Here
            return true;
          }
          return onKeyUp(keyCode, event);
        }
        return onKeyDown(keyCode, event);
      }
    });

    super.loadUrl("file:///android_asset/www/pages/intro/main.html");

    Intent intent = getIntent();
    level = intent.getIntExtra(PluginUtils.LEVEL, 0);
  }

  public int getLevel() {
    return level;
  }
}
