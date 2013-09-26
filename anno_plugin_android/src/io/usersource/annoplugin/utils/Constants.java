package io.usersource.annoplugin.utils;

public class Constants {

  public static final String ACCOUNT_TYPE_GOOGLE = "com.google";
  public static final String ACCOUNT_TYPE_USERSOURCE = "usersource.io";
  public static final String AUTHENTICATION_TYPE_AH = "ah";
  public static final String ACCOUNT = "anno_account";
  public static final String AUTH_TOKEN = "anno_auth_token";

  public static final String DEFAULT_ANNO_TYPE = "simple comment";

  // if image size exceeds this threshold, anno will compress and send to
  // server.
  public static final long IMAGE_SIZE_THRESHOLD = 500 * 1024;

  public static final String ANNO_SOURCE_PLUGIN = "plugin";
  public static final String ANNO_SOURCE_STANDALONE = "standalone";

  /**
   * Comment prefix. This string will prepend to comment if it's the first time
   * anno launch.
   */
  public static final String PRACTICE_PREFIX = "[PRACTICE]";
}
