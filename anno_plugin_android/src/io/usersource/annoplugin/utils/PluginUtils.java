/**
 * 
 */
package io.usersource.annoplugin.utils;

/**
 * Utilities related to the plugin.
 * 
 * @author topcircler
 * 
 */
public class PluginUtils {

  public static final String LEVEL = "level";

  /**
   * This constant should be kept consistently with package name in Anno
   * standalone app.
   */
  private static final String ANNO_PACKAGE_NAME = "io.usersource.anno";

  /**
   * Check if current app is standalone anno.
   * 
   * @param packageName
   *          current app package name.
   * @return if current app is standalone anno.
   */
  public static boolean isAnno(String packageName) {
    return ANNO_PACKAGE_NAME.equals(packageName);
  }

}
