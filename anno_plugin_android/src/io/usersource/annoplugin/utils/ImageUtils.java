/**
 * 
 */
package io.usersource.annoplugin.utils;

import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.graphics.drawable.BitmapDrawable;
import android.view.ViewGroup;

/**
 * Image Utilities.
 * 
 * @author topcircler
 * 
 */
public final class ImageUtils {

  /**
   * Image Orientation constants - portrait.
   */
  public static final String IMAGE_ORIENTATION_PORTRAIT = "portrait";
  /**
   * Image Orientation constants - landscape.
   */
  public static final String IMAGE_ORIENTATION_LANDSCAPE = "landscape";

  /**
   * Get bitmap from image view.
   * 
   * @param imageView
   *          imageView.
   * @return bitmap.
   */
  public static Bitmap getBitmapFromImageView(ViewGroup imageView) {
    Bitmap bitmap = ((BitmapDrawable) imageView.getBackground()).getBitmap();
    return bitmap;
  }

  /**
   * Compress the given bitmap and return a compressed one.
   * 
   * @param bitmap
   *          original bitmap.
   * @return compressed bitmap.
   */
  public static Bitmap compressBitmap(Bitmap bitmap) {
    // TODO: implement compress bitmap.
    return bitmap;
  }

  /**
   * Determine if the image orientation is landscape or portrait.
   * 
   * @param drawable
   * @return IMAGE_ORIENTATION_PORTRAIT or IMAGE_ORIENTATION_LANDSCAPE.
   */
  public static String isLandscapeOrPortrait(BitmapDrawable drawable) {
    int width = drawable.getBitmap().getWidth();
    int height = drawable.getBitmap().getHeight();
    if (width > height) {
      return IMAGE_ORIENTATION_LANDSCAPE;
    } else {
      return IMAGE_ORIENTATION_PORTRAIT;
    }
  }

  /**
   * Rotate the image.
   * 
   * @param drawable
   */
  public static BitmapDrawable rotateImage(BitmapDrawable drawable, int degree) {
    Bitmap bitmap = drawable.getBitmap();

    Matrix matrix = new Matrix();
    matrix.postRotate(degree);
    Bitmap rotatedBMP = Bitmap.createBitmap(drawable.getBitmap(), 0, 0,
        bitmap.getWidth(), bitmap.getHeight(), matrix, true);
    return new BitmapDrawable(rotatedBMP);
  }
}
