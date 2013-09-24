/**
 * 
 */
package io.usersource.annoplugin.datastore;

import io.usersource.annoplugin.R;
import io.usersource.annoplugin.utils.AppConfig;
import io.usersource.annoplugin.utils.SystemUtils;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.UUID;

import android.content.Context;
import android.content.res.Resources.NotFoundException;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.util.Log;

/**
 * Implement ImageManage interface, it saves and loads images from SD card data
 * directory.
 * 
 * @author topcircler
 * 
 */
public class FileImageManage implements ImageManage {

  private static final String TAG = FileImageManage.class.getSimpleName();
  // no effect for png.
  private static final int COMPRESS_QUALITY = 40;

  private Context context;
  private AppConfig config;

  public FileImageManage(Context context, AppConfig config) {
    this.context = context;
    this.config = config;
  }

  @Override
  public String saveImage(Bitmap bitmap) throws IOException {
    String appLocation = config.getDataLocation();
    String screenshotDirName = config.getScreenshotDirName();
    String screenshotDirPath = new File(appLocation, screenshotDirName)
        .getAbsolutePath();
    SystemUtils.mkdirs(context, screenshotDirPath);
    checkEnoughSpace(bitmap.getByteCount());

    String imageKey = generateUniqueImageKey();
    FileOutputStream out = new FileOutputStream(new File(screenshotDirPath,
        imageKey));
    bitmap.compress(Bitmap.CompressFormat.PNG, COMPRESS_QUALITY, out);
    return imageKey;
  }

  /**
   * Save the image to the disk with specified key
   * 
   * @param bitmap
   *          image for saving
   * @param key
   *          for saving bitmap
   * @throws IOException
   */
  public void saveImageWithKey(Bitmap bitmap, String key) throws IOException {
    String appLocation = config.getDataLocation();
    String screenshotDirName = config.getScreenshotDirName();
    String screenshotDirPath = new File(appLocation, screenshotDirName)
        .getAbsolutePath();
    SystemUtils.mkdirs(context, screenshotDirPath);
    checkEnoughSpace(bitmap.getByteCount());

    FileOutputStream out = new FileOutputStream(
        new File(screenshotDirPath, key));
    bitmap.compress(Bitmap.CompressFormat.PNG, COMPRESS_QUALITY, out);
  }

  /**
   * Check if there is enough space on SD card.
   * 
   * @param size
   * @throws IOException
   * @throws NotFoundException
   */
  private void checkEnoughSpace(int size) throws IOException {
    if (SystemUtils.getFreeSDCardSpace() < size) {
      throw new IOException(context.getResources().getString(
          R.string.fail_enough_sdcard_space));
    }
  }

  /**
   * Generate a unique key for each image.
   * 
   * Temporarily use UUID to generate a random unique one.
   * 
   * @return image key.
   */
  private String generateUniqueImageKey() {
    return UUID.randomUUID().toString();
  }

  @Override
  public Bitmap loadImage(String key) {
    String appLocation = config.getDataLocation();
    String screenshotDirName = config.getScreenshotDirName();
    String screenshotDirPath = new File(appLocation, screenshotDirName)
        .getAbsolutePath();
    File imageFile = new File(screenshotDirPath, key);
    return BitmapFactory.decodeFile(imageFile.getAbsolutePath());
  }

  @Override
  public long imageSize(String key) {
    String appLocation = config.getDataLocation();
    String screenshotDirName = config.getScreenshotDirName();
    String screenshotDirPath = new File(appLocation, screenshotDirName)
        .getAbsolutePath();
    File imageFile = new File(screenshotDirPath, key);
    if (imageFile.exists()) {
      return imageFile.length();
    }
    return -1;
  }

  @Override
  public String compressImage(String key) {
    Log.d(TAG, "Compress image: " + key);
    String appLocation = config.getDataLocation();
    String screenshotDirName = config.getScreenshotDirName();
    String screenshotDirPath = new File(appLocation, screenshotDirName)
        .getAbsolutePath();
    File imageFile = new File(screenshotDirPath, key);
    Log.d(TAG, "image-" + key + " original size is " + imageFile.length()
        + " bytes.");
    // TODO: disable compression, since this may affect circle position.
    // Bitmap bm = getSmallBitmap(imageFile.getAbsolutePath());
    Bitmap bm = BitmapFactory.decodeFile(imageFile.getAbsolutePath());
    ByteArrayOutputStream baos = new ByteArrayOutputStream();

    bm.compress(Bitmap.CompressFormat.PNG, COMPRESS_QUALITY, baos);
    byte[] b = baos.toByteArray();
    Log.d(TAG, "image-" + key + " size after compression is " + b.length
        + " bytes.");
    return Base64.encodeToString(b, Base64.URL_SAFE);
  }

  private int calculateInSampleSize(BitmapFactory.Options options,
      int reqWidth, int reqHeight) {
    final int height = options.outHeight;
    final int width = options.outWidth;
    int inSampleSize = 1;

    if (height > reqHeight || width > reqWidth) {
      final int heightRatio = Math.round((float) height / (float) reqHeight);
      final int widthRadio = Math.round((float) width / (float) reqWidth);
      inSampleSize = heightRatio < widthRadio ? heightRatio : widthRadio;
    }
    return inSampleSize;
  }

  private Bitmap getSmallBitmap(String path) {
    final BitmapFactory.Options options = new BitmapFactory.Options();
    options.inJustDecodeBounds = true;
    BitmapFactory.decodeFile(path, options);
    options.inSampleSize = calculateInSampleSize(options, 480, 800);
    options.inJustDecodeBounds = false;
    return BitmapFactory.decodeFile(path, options);
  }
}
