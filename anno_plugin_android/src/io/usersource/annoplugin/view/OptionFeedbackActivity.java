package io.usersource.annoplugin.view;

import org.apache.cordova.DroidGap;
import android.os.Bundle;


public class OptionFeedbackActivity extends DroidGap
{
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    super.init();

    super.loadUrl("file:///android_asset/www/pages/feedback/main.html");
  }
}
