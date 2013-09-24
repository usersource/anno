/**
 * 
 */
package io.usersource.annoplugin.view.custom;

import io.usersource.annoplugin.R;
import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.util.AttributeSet;
import android.widget.RelativeLayout;

/**
 * @author topcircler
 * 
 */
public class EditTextLayout extends RelativeLayout {

  private Paint paint;
  private Path path;

  private float arrowLeft;
  private float arrowLeftRightSpace;
  private boolean arrowOnTop;
  private int arrowBackgroundColor;
  private int arrowBorderColor;
  private static final float BORDER_WIDTH = 6; // in px.

  /**
   * @param context
   * @param attrs
   */
  public EditTextLayout(Context context, AttributeSet attrs) {
    super(context, attrs);

    TypedArray a = context.obtainStyledAttributes(attrs,
        R.styleable.CommentArea);
    arrowLeft = a.getDimension(R.styleable.CommentArea_arrow_left, 100);
    arrowLeftRightSpace = a.getDimension(
        R.styleable.CommentArea_arrow_left_right_space, 40);
    arrowOnTop = a.getBoolean(R.styleable.CommentArea_arrow_on_top, true);
    arrowBackgroundColor = a.getColor(
        R.styleable.CommentArea_arrow_background_color,
        R.color.commentbox_background);
    arrowBorderColor = a.getColor(R.styleable.CommentArea_arrow_border_color,
        R.color.commentbox_border);

    // this.setWillNotDraw(false);

    paint = new Paint();
    path = new Path();

    a.recycle();
  }

  /*
   * (non-Javadoc)
   * 
   * @see android.view.ViewGroup#dispatchDraw(android.graphics.Canvas)
   */
  @Override
  protected void dispatchDraw(Canvas canvas) {

    int width = this.getWidth();
    int height = this.getHeight();

    drawBackground(canvas, width, height);
    drawBorder(canvas, width, height);

    super.dispatchDraw(canvas);
  }

  private void drawBorder(Canvas canvas, int width, int height) {
    paint.setColor(arrowBackgroundColor);
    paint.setStrokeWidth(BORDER_WIDTH);
    if (arrowOnTop) {
      canvas.drawLine(arrowLeft, BORDER_WIDTH / 2, arrowLeft
          + arrowLeftRightSpace, BORDER_WIDTH / 2, paint);
    } else {
      canvas.drawLine(arrowLeft, height - BORDER_WIDTH / 2, arrowLeft
          + arrowLeftRightSpace, height - BORDER_WIDTH / 2, paint);
    }

    paint.setColor(arrowBorderColor);
    canvas.drawLine(BORDER_WIDTH / 2, 0, BORDER_WIDTH / 2, height, paint);
    canvas.drawLine(width - BORDER_WIDTH / 2, 0, width - BORDER_WIDTH / 2,
        height, paint);
    if (arrowOnTop) {
      canvas.drawLine(0, BORDER_WIDTH / 2, arrowLeft, BORDER_WIDTH / 2, paint);
      canvas.drawLine(arrowLeft + arrowLeftRightSpace, BORDER_WIDTH / 2, width,
          BORDER_WIDTH / 2, paint);
    } else {
      canvas.drawLine(0, BORDER_WIDTH / 2, width, BORDER_WIDTH / 2, paint);
    }
    if (arrowOnTop) {
      canvas.drawLine(0, height - BORDER_WIDTH / 2, width, height
          - BORDER_WIDTH / 2, paint);
    } else {
      canvas.drawLine(0, height - BORDER_WIDTH / 2, arrowLeft, height
          - BORDER_WIDTH / 2, paint);
      canvas.drawLine(arrowLeft + arrowLeftRightSpace, height - BORDER_WIDTH
          / 2, width, height - BORDER_WIDTH / 2, paint);
    }
  }

  private void drawBackground(Canvas canvas, int width, int height) {
    paint.setStrokeWidth(1);
    path.reset();
    paint.setColor(arrowBackgroundColor);
    path.moveTo(BORDER_WIDTH, BORDER_WIDTH);
    path.lineTo(width - BORDER_WIDTH, BORDER_WIDTH);
    path.lineTo(width - BORDER_WIDTH, height - BORDER_WIDTH);
    path.lineTo(BORDER_WIDTH, height - BORDER_WIDTH);
    path.lineTo(BORDER_WIDTH, BORDER_WIDTH);
    canvas.drawPath(path, paint);
    path.close();
  }

  /**
   * @param arrowLeft
   *          the arrowLeft to set
   */
  public void setArrowLeft(float arrowLeft) {
    this.arrowLeft = arrowLeft;
  }

  /**
   * @param arrowLeftRightSpace
   *          the arrowLeftRightSpace to set
   */
  public void setArrowLeftRightSpace(float arrowLeftRightSpace) {
    this.arrowLeftRightSpace = arrowLeftRightSpace;
  }

  /**
   * @param arrowOnTop
   *          the arrowOnTop to set
   */
  public void setArrowOnTop(boolean arrowOnTop) {
    this.arrowOnTop = arrowOnTop;
  }

  /**
   * @param arrowBackgroundColor
   *          the arrowBackgroundColor to set
   */
  public void setArrowBackgroundColor(int arrowBackgroundColor) {
    this.arrowBackgroundColor = arrowBackgroundColor;
  }

  /**
   * @param arrowBorderColor
   *          the arrowBorderColor to set
   */
  public void setArrowBorderColor(int arrowBorderColor) {
    this.arrowBorderColor = arrowBorderColor;
  }

}
