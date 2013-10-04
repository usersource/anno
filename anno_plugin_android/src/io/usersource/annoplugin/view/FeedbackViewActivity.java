package io.usersource.annoplugin.view;

import io.usersource.annoplugin.AnnoPlugin;
import io.usersource.annoplugin.R;
import io.usersource.annoplugin.datastore.FileImageManage;
import io.usersource.annoplugin.datastore.ImageManage;
import io.usersource.annoplugin.datastore.TableCommentFeedbackAdapter;
import io.usersource.annoplugin.model.AnnoContentProvider;
import io.usersource.annoplugin.utils.AppConfig;
import io.usersource.annoplugin.utils.PluginUtils;
import io.usersource.annoplugin.view.custom.CircleArrow;
import io.usersource.annoplugin.view.custom.CommentAreaLayout;

import java.lang.ref.WeakReference;

import android.app.ActionBar;
import android.app.Activity;
import android.content.AsyncQueryHandler;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.drawable.BitmapDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RelativeLayout;

/**
 * View comment feedback.
 * 
 * You can view comment for the chosen comment.
 * 
 * @author topcircler
 * 
 */
public class FeedbackViewActivity extends Activity {

  private static final String TAG = FeedbackViewActivity.class.getSimpleName();

  private ImageManage imageManage;
  private AsyncHandler handler;

  // components.
  private RelativeLayout viewImvScreenshot;
  private CommentAreaLayout viewCommentArea;
  private EditText tvComment;
  private ActionBar actionBar;
  private Button btnComment;
  private Button btnGoHome;
  private CircleArrow circleArrow;
  private RelativeLayout outerBackground;

  /**
   * token id represents retrieving comment in an async process.
   */
  private static final int TOKEN_GET_COMMENT = 1;

  private int level;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.feedback_view_activity);

    AppConfig config = AppConfig.getInstance(this);
    imageManage = new FileImageManage(this, config);
    handler = new AsyncHandler(getContentResolver(), this);

    setComponents();
    handleIntent();

    AnnoPlugin.setEnableGesture(this, R.id.gestures, true);
  }

  private void handleIntent() {
    Intent intent = getIntent();
    level = intent.getIntExtra(PluginUtils.LEVEL, 0);
    String[] projection = { TableCommentFeedbackAdapter.COL_ID,
        TableCommentFeedbackAdapter.COL_COMMENT,
        TableCommentFeedbackAdapter.COL_SCREENSHOT_KEY,
        TableCommentFeedbackAdapter.COL_POSITION_X,
        TableCommentFeedbackAdapter.COL_POSITION_Y,
        TableCommentFeedbackAdapter.COL_DIRECTION,
        TableCommentFeedbackAdapter.COL_MOVED,
        TableCommentFeedbackAdapter.COL_LEVEL };
    Uri uri = intent.getParcelableExtra(AnnoContentProvider.COMMENT_PATH);
    handler.startQuery(TOKEN_GET_COMMENT, null, uri, projection, null, null,
        null);
  }

  private void setComponents() {
    viewImvScreenshot = (RelativeLayout) findViewById(R.id.viewImvScreenshot);
    tvComment = (EditText) findViewById(R.id.etComment);
    tvComment.setEnabled(false);
    outerBackground = (RelativeLayout) findViewById(R.id.outer_bg);
    viewCommentArea = (CommentAreaLayout) findViewById(R.id.viewCommentArea);
    viewCommentArea.setChangable(false);
    btnComment = (Button) findViewById(R.id.btnComment);
    btnComment.setVisibility(View.INVISIBLE);
    actionBar = getActionBar();
    actionBar.hide();
    btnGoHome = (Button) findViewById(R.id.btnGoHome);
    btnGoHome.setVisibility(View.GONE);
    circleArrow = (CircleArrow) findViewById(R.id.circleArrow);
  }

  private static class AsyncHandler extends AsyncQueryHandler {

    private WeakReference<FeedbackViewActivity> activityRef;

    public AsyncHandler(ContentResolver cr, FeedbackViewActivity activity) {
      super(cr);
      activityRef = new WeakReference<FeedbackViewActivity>(activity);
    }

    @Override
    protected void onQueryComplete(int token, Object cookie, Cursor cursor) {
      super.onQueryComplete(token, cookie, cursor);

      FeedbackViewActivity activity = activityRef.get();
      if (token == TOKEN_GET_COMMENT) {
        if (cursor != null && cursor.moveToFirst()) {

          initComment(cursor, activity);
          initImage(cursor, activity);
          initPosition(cursor, activity);
          initCircle(cursor, activity);
          initStyle(cursor, activity);
        }
      }
      activity = null;
      if (!cursor.isClosed()) {
        cursor.close();
      }
    }

    private void initStyle(Cursor cursor, FeedbackViewActivity activity) {
      int idx = cursor.getColumnIndex(TableCommentFeedbackAdapter.COL_LEVEL);
      if (idx != -1) {
        int level = cursor.getInt(idx);
        if (level == 2) {
          activity.outerBackground.setBackgroundColor(activity.getResources()
              .getColor(R.color.red));
          activity.circleArrow.setCircleBackgroundColor(activity.getResources()
              .getColor(R.color.transparent_red));
          activity.circleArrow.setCircleBorderColor(activity.getResources()
              .getColor(R.color.red));
        }
      }
    }

    private void initCircle(Cursor cursor, final FeedbackViewActivity activity) {
      int idx;
      idx = cursor.getColumnIndex(TableCommentFeedbackAdapter.COL_MOVED);
      if (idx != -1) {
        int isMoved = cursor.getInt(idx);
        if (isMoved == 0) {
          activity.circleArrow.setCircleDisplayed(false);
        } else {
          activity.circleArrow.setCircleDisplayed(true);
        }
      }
    }

    private void initPosition(Cursor cursor, FeedbackViewActivity activity) {
      int xIdx = cursor
          .getColumnIndex(TableCommentFeedbackAdapter.COL_POSITION_X);
      int yIdx = cursor
          .getColumnIndex(TableCommentFeedbackAdapter.COL_POSITION_Y);
      int directionIdx = cursor
          .getColumnIndex(TableCommentFeedbackAdapter.COL_DIRECTION);
      if (xIdx != -1 && yIdx != -1 && directionIdx != -1) {
        final int xRatio = cursor.getInt(xIdx);
        final int yRatio = cursor.getInt(yIdx);
        final int direction = cursor.getInt(directionIdx);
        final FeedbackViewActivity finalActivity = activity;
        activity.viewCommentArea.post(new Runnable() {

          @Override
          public void run() {
            /*
             * x/y ratio is percentage / 100.
             */
            int screenshotWidth = finalActivity.viewImvScreenshot.getWidth();
            int screenshotHeight = finalActivity.viewImvScreenshot.getHeight();
            int x = screenshotWidth * xRatio / 10000;
            int y = screenshotHeight * yRatio / 10000;
            finalActivity.viewCommentArea.locate(x, y, direction);
          }

        });
      }
    }

    private void initImage(Cursor cursor, FeedbackViewActivity activity) {
      int idx;
      idx = cursor
          .getColumnIndex(TableCommentFeedbackAdapter.COL_SCREENSHOT_KEY);
      if (idx != -1) {
        String imageKey = cursor.getString(idx);
        BitmapDrawable drawable = new BitmapDrawable(
            activity.imageManage.loadImage(imageKey));
        activity.viewImvScreenshot.setBackgroundDrawable(drawable);
      }
    }

    private void initComment(Cursor cursor, FeedbackViewActivity activity) {
      int idx = cursor.getColumnIndex(TableCommentFeedbackAdapter.COL_COMMENT);
      if (idx != -1) {
        String comment = cursor.getString(idx);
        activity.tvComment.setText(comment);
      }
    }
  }

  /**
   * @return the level
   */
  public int getLevel() {
    return level;
  };

}
