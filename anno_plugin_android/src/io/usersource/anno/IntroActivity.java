package io.usersource.anno;

import android.content.Intent;
import android.gesture.GestureOverlayView;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import io.usersource.annoplugin.utils.AnnoUtils;
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
    AnnoUtils.setEnableGesture(this, view, true);

    super.loadUrl("file:///android_asset/www/anno/pages/intro/main.html");

    Intent intent = getIntent();
    level = intent.getIntExtra(AnnoUtils.LEVEL, 0);
  }

  public int getLevel() {
    return level;
  }
}
