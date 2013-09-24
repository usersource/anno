package io.usersource.annoplugin.view;

import org.apache.cordova.DroidGap;

import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;

public class IntroActivity extends DroidGap {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    super.init();

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
  }
}
