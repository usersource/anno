/**
 * 
 */
package io.usersource.annoplugin.view.custom;

import io.usersource.annoplugin.R;
import android.content.Context;
import android.content.res.TypedArray;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

/**
 * @author topcircler
 * 
 */
public class CommentAreaLayout extends RelativeLayout {

  private CircleArrow circle;
  private EditTextLayout commentLayout;
  private EditText commentInput;
  private LinearLayout commentActionBar;
  private Button goHomeButton;
  private float boundary;
  private static final float DEFAULT_BOUNDARY = 10;
  private boolean circleOnTop = true;
  private Context context;

  /**
   * @param context
   * @param attrs
   */
  public CommentAreaLayout(Context context, AttributeSet attrs) {
    super(context, attrs);
    this.context = context;

    LayoutInflater.from(context).inflate(R.layout.comment_area_layout, this,
        true);

    TypedArray a = context.obtainStyledAttributes(attrs,
        R.styleable.CommentArea);
    boundary = a.getDimension(R.styleable.CommentArea_arrow_boundary,
        DEFAULT_BOUNDARY);

    a.recycle();
  }

  public void locate(int x, int y, int direction) {
    circle = getCircleArrow();
    commentLayout = getCommentLayout();
    commentInput = getCommentInput();
    commentActionBar = getCommentActionBar();

    flip(direction == 1 ? true : false);

    RelativeLayout.LayoutParams lp = new RelativeLayout.LayoutParams(
        this.getWidth(), this.getHeight());
    lp.setMargins(0, y, 0, 0);
    this.setLayoutParams(lp);

    setHorizontalPosition(x);

    circle.invalidate();
    commentLayout.invalidate();
    commentActionBar.invalidate();
    invalidate();
  }

  public void move(int x, int y) {
    circle = getCircleArrow();
    commentLayout = getCommentLayout();
    commentInput = getCommentInput();
    commentActionBar = getCommentActionBar();

    RelativeLayout parent = (RelativeLayout) this.getParent();
    int parentHeight = parent.getHeight();
    if (circleOnTop) {
      if (y > parentHeight / 3) { // lower than 1/3, change circle to
                                  // bottom.
        flip(circleOnTop);
        circleOnTop = false;
      }
    } else {
      if (y < parentHeight / 3) {
        flip(circleOnTop);
        circleOnTop = true;
      }
    }

    setVerticalPosition(y, parent);
    setHorizontalPosition(x);
    circle.invalidate();
    commentInput.invalidate();
    commentLayout.invalidate();
    commentActionBar.invalidate();
    invalidate();
  }

  private void setVerticalPosition(int y, RelativeLayout parent) {
    if (y + circle.getCircleRadius() < parent.getHeight()) {
      RelativeLayout.LayoutParams lp = new RelativeLayout.LayoutParams(
          LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT);
      if (circleOnTop) {
        lp.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        lp.setMargins(0, y, 0, 0);
      } else {
        /*
         * lp.setMargins( 0, y - (int) commentActionBar.getHeight() - (int)
         * circle.getCircleRadius(), 0, 0);
         */
        lp.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        lp.setMargins(0, 0, 0, parent.getHeight() - y);
      }
      this.setLayoutParams(lp);
    }
  }

  private void setHorizontalPosition(int x) {
    if (x + circle.getCircleRadius() * 2 < getWidth()) {
      float margin = this.getContext().getResources()
          .getDimension(R.dimen.comment_area_marginLeftRight);
      float arrowSpace = this.getContext().getResources()
          .getDimension(R.dimen.comment_arrow_space);
      circle.setCircleLeft(x);
      if (x < margin + boundary) {
        circle.setArrowLeft(margin + boundary);
        commentLayout.setArrowLeft(boundary);
      } else if (x > margin + commentLayout.getWidth() - boundary - arrowSpace) {
        circle.setArrowLeft(margin + commentLayout.getWidth() - boundary
            - arrowSpace);
        commentLayout.setArrowLeft(commentLayout.getWidth() - boundary
            - arrowSpace);
      } else {
        circle.setArrowLeft(x);
        commentLayout.setArrowLeft(x - margin);
      }
    }
  }

  private void flip(boolean direction) {
    RelativeLayout.LayoutParams circleLp = new RelativeLayout.LayoutParams(
        LayoutParams.MATCH_PARENT, (int) getContext().getResources()
            .getDimension(R.dimen.comment_indicate_height));
    RelativeLayout.LayoutParams abLp = new RelativeLayout.LayoutParams(
        LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT);
    int margin = (int) getContext().getResources().getDimension(
        R.dimen.comment_area_marginLeftRight);
    abLp.setMargins(margin, 0, margin, 0);
    if (direction) { // top to bottom
      abLp.addRule(RelativeLayout.ALIGN_PARENT_TOP);
      abLp.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
      circleLp.addRule(RelativeLayout.BELOW, R.id.commentActionBar);
      // abLp.addRule(RelativeLayout.ABOVE, R.id.circleArrow);
    } else { // bottom to top.
      circleLp.addRule(RelativeLayout.ALIGN_PARENT_TOP);
      circleLp.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
      abLp.addRule(RelativeLayout.BELOW, R.id.circleArrow);
    }
    commentLayout.setArrowOnTop(!direction);
    circle.setArrowOnTop(!direction);
    circle.setLayoutParams(circleLp);
    commentActionBar.setLayoutParams(abLp);
  }

  public float getCircleX() {
    return getCircleArrow().getCircleLeft();
  }

  public float getCircleY() {
    return getCircleArrow().getY() + getY();
  }

  private CircleArrow getCircleArrow() {
    if (circle == null) {
      circle = (CircleArrow) findViewById(R.id.circleArrow);
    }
    return circle;
  }

  private EditTextLayout getCommentLayout() {
    if (commentLayout == null) {
      commentLayout = (EditTextLayout) findViewById(R.id.inputArea);
    }
    return commentLayout;
  }

  private EditText getCommentInput() {
    if (commentInput == null) {
      commentInput = (EditText) findViewById(R.id.etComment);
    }
    return commentInput;
  }

  private LinearLayout getCommentActionBar() {
    if (commentActionBar == null) {
      commentActionBar = (LinearLayout) findViewById(R.id.commentActionBar);
    }
    return commentActionBar;
  }

  private Button getHomeButton() {
    if (goHomeButton == null) {
      goHomeButton = (Button) findViewById(R.id.btnGoHome);
    }
    return goHomeButton;
  }

  public void setChangable(boolean isChangable) {
    getCircleArrow().setMovable(isChangable);
  }

  public boolean circleOnTop() {
    return circleOnTop;
  }

  public void startMoving() {
    hideHomeButton();
  }

  public void hideHomeButton() {
    InputMethodManager imm = (InputMethodManager) this.getContext()
        .getSystemService(Context.INPUT_METHOD_SERVICE);
    imm.hideSoftInputFromWindow(getCommentInput().getWindowToken(),
        InputMethodManager.RESULT_UNCHANGED_SHOWN);

    getHomeButton().setVisibility(View.GONE);
  }

}
