/**
 * 
 */
package io.usersource.annoplugin.hotkey;

import java.io.File;
import java.util.concurrent.atomic.AtomicBoolean;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.FileObserver;
import android.util.Log;

/**
 * @author topcircler
 * 
 */
public class MyFileObserver extends FileObserver {

  private Context context;
  private Intent intent;
  private AtomicBoolean started;

  public void setContext(Context context) {
    this.context = context;
  }

  /**
   * @param path
   */
  public MyFileObserver(String path) {
    super(path);

    started = new AtomicBoolean(false);

    intent = new Intent(Intent.ACTION_SEND);
    intent.setClassName("io.usersource.doui",
        "io.usersource.annoplugin.view.FeedbackEditActivity");
    intent.setType("image/*");
  }

  /*
   * (non-Javadoc)
   * 
   * @see android.os.FileObserver#onEvent(int, java.lang.String)
   */
  @Override
  public void onEvent(int event, String path) {
    switch (event) {
    case android.os.FileObserver.CREATE:
      Log.d("MyFileObserver", "create on screenshot dir: " + path);
      started.set(true);
      break;
    case android.os.FileObserver.CLOSE_WRITE:
      Log.d("MyFileObserver", "close write:" + path);
      if (started.get()) {
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setClassName("io.usersource.doui",
            "io.usersource.annoplugin.view.FeedbackEditActivity");
        intent.setType("image/*");
        File imageFile = new File("/sdcard/Pictures/Screenshots/" + path);
        Uri imageUri = Uri.parse("file://" + imageFile.getPath());
        intent.putExtra(Intent.EXTRA_STREAM, imageUri);
        context.startActivity(intent);
        started.set(false);
      }
      break;
    case android.os.FileObserver.ACCESS:
      Log.d("MyFileObserver", "access:" + path);
      break;
    case android.os.FileObserver.ATTRIB:
      Log.d("MyFileObserver", "attrib:" + path);
      break;
    case android.os.FileObserver.CLOSE_NOWRITE:
      Log.d("MyFileObserver", "close_nowrite:" + path);

      break;
    case android.os.FileObserver.DELETE:
      Log.d("MyFileObserver", "delete:" + path);
      break;
    case android.os.FileObserver.DELETE_SELF:
      Log.d("MyFileObserver", "modify:" + path);
      break;
    case android.os.FileObserver.MODIFY:
      Log.d("MyFileObserver", "modify:" + path);
      break;
    case android.os.FileObserver.MOVED_FROM:
      Log.d("MyFileObserver", "moved_from:" + path);
      break;
    case android.os.FileObserver.MOVED_TO:
      Log.d("MyFileObserver", "moved_to:" + path);
      break;
    case android.os.FileObserver.OPEN:
      Log.d("MyFileObserver", "open:" + path);
      break;
    }
  }

}
