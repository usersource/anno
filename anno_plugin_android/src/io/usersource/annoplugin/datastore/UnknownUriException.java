/**
 * 
 */
package io.usersource.annoplugin.datastore;

import android.net.Uri;

/**
 * Exception represents an unknown uri.
 * 
 * @author topcircler
 * 
 */
public class UnknownUriException extends RuntimeException {

  private static final long serialVersionUID = -7142579836257693608L;

  private Uri uri;
  private int code;

  public UnknownUriException() {
    super();
  }

  public UnknownUriException(Uri uri, int code) {
    this.uri = uri;
    this.code = code;
  }

  public UnknownUriException(Uri uri, int code, String message) {
    super(message);
    this.uri = uri;
    this.code = code;
  }

  /**
   * @return the uri
   */
  public Uri getUri() {
    return uri;
  }

  /**
   * @return the code
   */
  public int getCode() {
    return code;
  }

}
