/**
 * 
 */
package io.usersource.annoplugin.view.custom;

import io.usersource.annoplugin.AnnoPlugin;
import io.usersource.annoplugin.R;
import io.usersource.annoplugin.utils.ViewUtils;
import io.usersource.annoplugin.view.FeedbackEditActivity;
import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Paint.Style;
import android.graphics.Path;
import android.util.AttributeSet;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;

/**
 * 
 * 
 * @author topcircler
 * 
 */
public class CircleArrow extends View implements View.OnTouchListener {

  private static final String TAG = "CircleArrow";

  // in dip.
  private static final float DEFAULT_CIRCLE_RADIUS = 20;
  private static final float DEFAULT_CIRCLE_LEFT = 100;
  private static final float BORDER_WIDTH = 6; // in px.
  private float borderHeight;
  private float borderWidth;

  private float circleRadius;
  private int circleBackgroundColor;
  private int circleBorderColor;
  private int arrowBorderColor;
  private int arrowBackgroundColor;
  private float circleLeft;
  private float arrowLeft;
  private float arrowLeftRightSpace;
  private boolean arrowOnTop;

  private Paint paint;
  private Path path;

  private boolean flag = false;
  private boolean isMovable = true;
  private boolean isMoved = false;
  private boolean circleDisplayed = true;

  // bad design to store activity here.
  private FeedbackEditActivity activity;

  /**
   * @param context
   * @param attrs
   */
  public CircleArrow(Context context, AttributeSet attrs) {
    super(context, attrs);

    TypedArray a = context.obtainStyledAttributes(attrs,
        R.styleable.CommentArea);
    circleRadius = a.getDimension(R.styleable.CommentArea_circle_radius,
        ViewUtils.dip2px(context, DEFAULT_CIRCLE_RADIUS));
    circleBackgroundColor = a.getColor(
        R.styleable.CommentArea_circle_background_color,
        R.color.circle_background);
    circleBorderColor = a.getColor(R.styleable.CommentArea_circle_border_color,
        R.color.circle_border);
    arrowBorderColor = a.getColor(R.styleable.CommentArea_arrow_border_color,
        R.color.commentbox_border);
    arrowBackgroundColor = a.getColor(
        R.styleable.CommentArea_arrow_background_color,
        R.color.commentbox_background);
    circleLeft = a.getDimension(R.styleable.CommentArea_circle_left,
        ViewUtils.dip2px(context, DEFAULT_CIRCLE_LEFT));
    arrowLeft = a.getDimension(R.styleable.CommentArea_arrow_left,
        DEFAULT_CIRCLE_LEFT);
    arrowLeftRightSpace = a.getDimension(
        R.styleable.CommentArea_arrow_left_right_space, DEFAULT_CIRCLE_RADIUS);
    arrowOnTop = a.getBoolean(R.styleable.CommentArea_arrow_on_top, true);

    paint = new Paint();
    paint.setAntiAlias(true);
    path = new Path();

    this.setOnTouchListener(this);

    a.recycle();
  }

  public void setActivity(FeedbackEditActivity activity) {
    this.activity = activity;
  }

  public void setMovable(boolean isMovable) {
    if (this.isMovable != isMovable) {
      this.isMovable = isMovable;
    }
  }

  /*
   * (non-Javadoc)
   * 
   * @see android.view.View#onDraw(android.graphics.Canvas)
   */
  @Override
  protected void onDraw(Canvas canvas) {
    super.onDraw(canvas);

    int height = this.getHeight();

    if (circleDisplayed) {
      if (arrowOnTop) {
        drawCircleTop(canvas);
      } else {
        drawCircleBottom(canvas, height);
      }
    }
    if (circleLeft + circleRadius >= arrowLeft + arrowLeftRightSpace / 2) {
      borderWidth = similarLine(
          BORDER_WIDTH,
          verticalLine(circleLeft + circleRadius - arrowLeft, height
              - circleRadius), circleLeft + circleRadius - arrowLeft);
      borderHeight = similarLine(
          BORDER_WIDTH,
          verticalLine(circleLeft + circleRadius - arrowLeft, height
              - circleRadius), height - circleRadius);
      if (arrowOnTop) {
        drawTriangleTop(canvas, height);
        drawLeftLineTop(canvas, height, false);
        if (circleLeft + circleRadius <= arrowLeft + arrowLeftRightSpace) {
          drawRightLineTop(canvas, height, false);
        } else {
          drawRightLineTop(canvas, height, true);
        }
      } else {
        drawTriangleBottom(canvas, height);
        drawLeftLineBottom(canvas, height, false);
        if (circleLeft + circleRadius <= arrowLeft + arrowLeftRightSpace) {
          drawRightLineBottom(canvas, height, false);
        } else {
          drawRightLineBottom(canvas, height, true);
        }
      }
    } else if (circleLeft + circleRadius < arrowLeft + arrowLeftRightSpace / 2) {
      borderWidth = similarLine(
          BORDER_WIDTH,
          verticalLine(arrowLeft + arrowLeftRightSpace - circleLeft
              - circleRadius, height - circleRadius), arrowLeft
              + arrowLeftRightSpace - circleLeft - circleRadius);
      borderHeight = similarLine(
          BORDER_WIDTH,
          verticalLine(arrowLeft + arrowLeftRightSpace - circleLeft
              - circleRadius, height - circleRadius), height - circleRadius);
      if (arrowOnTop) {
        drawTriangleTop(canvas, height);
        drawRightLineTop(canvas, height, false);
        if (circleLeft + circleRadius >= arrowLeft) {
          drawLeftLineTop(canvas, height, false);
        } else {
          drawLeftLineTop(canvas, height, true);
        }
      } else {
        drawTriangleBottom(canvas, height);
        drawRightLineBottom(canvas, height, false);
        if (circleLeft + circleRadius >= arrowLeft) {
          drawLeftLineBottom(canvas, height, false);
        } else {
          drawLeftLineBottom(canvas, height, true);
        }
      }
    }
  }

  private void drawTriangleBottom(Canvas canvas, int height) {
    paint.setColor(arrowBackgroundColor);
    path.reset();
    path.moveTo(circleLeft + circleRadius, height - circleRadius - borderHeight);
    path.lineTo(arrowLeft + arrowLeftRightSpace, 0);
    path.lineTo(arrowLeft, 0);
    path.lineTo(circleLeft + circleRadius, height - circleRadius - borderHeight);
    canvas.drawPath(path, paint);
    path.close();
  }

  private void drawLeftLineBottom(Canvas canvas, int height, boolean flag) {
    paint.setColor(arrowBorderColor);
    path.reset();
    path.moveTo(circleLeft + circleRadius, height - circleRadius);
    if (flag) {
      path.lineTo(arrowLeft, 0);
      path.lineTo(arrowLeft - borderWidth, 0);
    } else {
      path.lineTo(arrowLeft - borderWidth, 0);
      path.lineTo(arrowLeft, 0);
    }
    path.lineTo(circleLeft + circleRadius, height - circleRadius - borderHeight);
    path.lineTo(circleLeft + circleRadius, height - circleRadius);
    canvas.drawPath(path, paint);
  }

  private void drawRightLineBottom(Canvas canvas, int height, boolean flag) {
    paint.setColor(arrowBorderColor);
    path.reset();
    path.moveTo(circleLeft + circleRadius, height - circleRadius);
    if (flag) {
      path.lineTo(arrowLeft + arrowLeftRightSpace, 0);
      path.lineTo(arrowLeft + arrowLeftRightSpace + borderWidth, 0);
    } else {
      path.lineTo(arrowLeft + arrowLeftRightSpace + borderWidth, 0);
      path.lineTo(arrowLeft + arrowLeftRightSpace, 0);
    }
    path.lineTo(circleLeft + circleRadius, height - circleRadius - borderHeight);
    path.lineTo(circleLeft + circleRadius, height - circleRadius);
    canvas.drawPath(path, paint);
  }

  private void drawCircleBottom(Canvas canvas, int height) {
    // draw outer border
    paint.setStyle(Style.STROKE);
    paint.setStrokeWidth(BORDER_WIDTH);
    paint.setColor(circleBorderColor);
    canvas.drawCircle(circleLeft + circleRadius, height - circleRadius,
        circleRadius - BORDER_WIDTH / 2, paint);

    // draw inner circle
    paint.setStyle(Style.FILL);
    float innerRadius = circleRadius - BORDER_WIDTH;
    paint.setColor(circleBackgroundColor);
    canvas.drawCircle(circleLeft + circleRadius, height - circleRadius,
        innerRadius, paint);
  }

  private void drawTriangleTop(Canvas canvas, int height) {
    paint.setColor(arrowBackgroundColor);
    path.reset();
    path.moveTo(circleLeft + circleRadius, circleRadius + borderHeight);
    path.lineTo(arrowLeft + arrowLeftRightSpace, height + 1);
    path.lineTo(arrowLeft, height + 1);
    path.lineTo(circleLeft + circleRadius, circleRadius + borderHeight);
    canvas.drawPath(path, paint);
    path.close();
  }

  private void drawLeftLineTop(Canvas canvas, int height, boolean flag) {
    paint.setColor(arrowBorderColor);
    path.reset();

    path.moveTo(circleLeft + circleRadius, circleRadius);
    if (flag) {
      path.lineTo(arrowLeft, height);
      path.lineTo(arrowLeft - borderWidth, height);
    } else {
      path.lineTo(arrowLeft - borderWidth, height);
      path.lineTo(arrowLeft, height);
    }
    path.lineTo(circleLeft + circleRadius, circleRadius + borderHeight);
    path.lineTo(circleLeft + circleRadius, circleRadius);
    canvas.drawPath(path, paint);
  }

  private void drawRightLineTop(Canvas canvas, int height, boolean flag) {
    paint.setColor(arrowBorderColor);
    path.reset();

    path.moveTo(circleLeft + circleRadius, circleRadius);
    if (flag) { // right
      path.lineTo(arrowLeft + arrowLeftRightSpace, height);
      path.lineTo(arrowLeft + arrowLeftRightSpace + borderWidth, height);
    } else { // left
      path.lineTo(arrowLeft + arrowLeftRightSpace + borderWidth, height);
      path.lineTo(arrowLeft + arrowLeftRightSpace, height);
    }
    path.lineTo(circleLeft + circleRadius, circleRadius + borderHeight);
    path.lineTo(circleLeft + circleRadius, circleRadius);
    canvas.drawPath(path, paint);
  }

  private void drawCircleTop(Canvas canvas) {
    // draw outer border
    paint.setStyle(Style.STROKE);
    paint.setStrokeWidth(BORDER_WIDTH);
    paint.setColor(circleBorderColor);
    canvas.drawCircle(circleLeft + circleRadius, circleRadius, circleRadius
        - BORDER_WIDTH / 2, paint);

    // draw inner circle
    paint.setStyle(Style.FILL);
    float innerRadius = circleRadius - BORDER_WIDTH;
    paint.setColor(circleBackgroundColor);
    canvas.drawCircle(circleLeft + circleRadius, circleRadius, innerRadius,
        paint);
  }

  @Override
  public boolean onTouch(View v, MotionEvent event) {
    final int x = (int) event.getRawX();
    final int y = (int) event.getRawY();
    switch (event.getAction() & MotionEvent.ACTION_MASK) {
    case MotionEvent.ACTION_DOWN:
      if (isMovable) {
        AnnoPlugin.setEnableGesture(activity, R.id.gestures, false);
        if (x >= circleLeft && x <= circleLeft + circleRadius * 2 && !flag) {
          flag = true;
          CommentAreaLayout layout = (CommentAreaLayout) this.getParent();
          layout.startMoving();
        }
      }
      break;
    case MotionEvent.ACTION_MOVE:
      if (flag) {
        isMoved = true;
        CommentAreaLayout layout = (CommentAreaLayout) this.getParent();
        layout.move(x, y);
      }
      break;
    case MotionEvent.ACTION_UP:
      flag = false;
      if (isMovable) {
        AnnoPlugin.setEnableGesture(activity, R.id.gestures, true);
      }
      break;
    }
    return true;
  }

  /**
   * @param circleRadius
   *          the circleRadius to set
   */
  public void setCircleRadius(float circleRadius) {
    this.circleRadius = circleRadius;
  }

  /**
   * @param circleBackgroundColor
   *          the circleBackgroundColor to set
   */
  public void setCircleBackgroundColor(int circleBackgroundColor) {
    this.circleBackgroundColor = circleBackgroundColor;
  }

  /**
   * @param circleBorderColor
   *          the circleBorderColor to set
   */
  public void setCircleBorderColor(int circleBorderColor) {
    this.circleBorderColor = circleBorderColor;
  }

  /**
   * @param arrowBorderColor
   *          the arrowBorderColor to set
   */
  public void setArrowBorderColor(int arrowBorderColor) {
    this.arrowBorderColor = arrowBorderColor;
  }

  /**
   * @param arrowBackgroundColor
   *          the arrowBackgroundColor to set
   */
  public void setArrowBackgroundColor(int arrowBackgroundColor) {
    this.arrowBackgroundColor = arrowBackgroundColor;
  }

  /**
   * @param circleLeft
   *          the circleLeft to set
   */
  public void setCircleLeft(float circleLeft) {
    this.circleLeft = circleLeft;
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
   * @return the circleRadius
   */
  public float getCircleRadius() {
    return circleRadius;
  }

  /**
   * @param arrowOnTop
   *          the arrowOnTop to set
   */
  public void setArrowOnTop(boolean arrowOnTop) {
    this.arrowOnTop = arrowOnTop;
  }

  /**
   * @return the circle center's x.
   */
  public float getCircleCenterX() {
    Log.d(TAG, "getCircleCenterX-circle left is " + circleLeft);
    return circleLeft + circleRadius;
  }

  /**
   * @return the circle center's y.
   */
  public float getCircleCenterY() {
    if (this.arrowOnTop) {
      Log.d(TAG, "getCircleCenterY-circle top:" + getY());
      return getY() + circleRadius;
    } else {
      return getY() + (this.getHeight() - circleRadius);
    }
  }

  private float verticalLine(float x, float y) {
    return (float) ((x * y) / Math.sqrt(x * x + y * y));
  }

  private float similarLine(float x1, float x2, float y2) {
    return x1 * y2 / x2;
  }

  /**
   * @return the isMoved
   */
  public boolean isMoved() {
    return isMoved;
  }

  public void setCircleDisplayed(boolean display) {
    if (this.circleDisplayed != display) {
      this.circleDisplayed = display;
      this.invalidate();
    }
  }

}
