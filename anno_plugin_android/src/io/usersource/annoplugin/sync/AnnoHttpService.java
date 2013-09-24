package io.usersource.annoplugin.sync;

/**
 * Interface for anno http services.
 * 
 * @author topcircler
 * 
 */
public interface AnnoHttpService {

  /**
   * Get annotation list.
   * 
   * @param offset
   *          page info. start index.
   * @param limit
   *          page info. how many annotation to retrieve.
   * @param respHandler
   *          http response handler.
   */
  void getAnnoList(long offset, long limit, ResponseHandler respHandler);

  /**
   * Get annotation detail.
   * 
   * @param annoId
   *          annotation id.
   * @param respHandler
   *          http response handler.
   */
  void getAnnoDetail(String annoId, ResponseHandler respHandler);

  /**
   * Update app name of an annotation.
   * 
   * @param annoId
   *          annotation id.
   * @param appName
   *          app name.
   * @param respHandler
   *          http response handler.
   */
  void updateAppName(String annoId, String appName, ResponseHandler respHandler);

  /**
   * Add a follow up for an annotation.
   * 
   * @param annoId
   *          annotation id.
   * @param comment
   *          follow up comment.
   * @param respHandler
   *          http response handler.
   */
  void addFollowup(String annoId, String comment, ResponseHandler respHandler);

  /**
   * Add a flag for an annotation.
   * 
   * @param annoId
   *          annotation id.
   * @param respHandler
   *          http response handler.
   */
  void addFlag(String annoId, ResponseHandler respHandler);

  /**
   * Add a vote for an annotation.
   * 
   * @param annoId
   *          annotation id.
   * @param respHandler
   *          http response handler.
   */
  void addVote(String annoId, ResponseHandler respHandler);

  /**
   * Get vote number for an annotation.
   * 
   * @param annoId
   *          annotation id.
   * @param respHandler
   *          http response handler.
   */
  void countVote(String annoId, ResponseHandler respHandler);

  /**
   * Get flag number for an annotation.
   * 
   * @param annoId
   *          annotation id.
   * @param respHandler
   *          http response handler.
   */
  void countFlag(String annoId, ResponseHandler respHandler);

  /**
   * Remove flag for an annotation.
   * 
   * @param annoId
   *          annotation id.
   * @param respHandler
   *          http response handler.
   */
  void removeFlag(String annoId, ResponseHandler respHandler);

  /**
   * Remove vote for an annotation.
   * 
   * @param annoId
   *          annotation id.
   * @param respHandler
   *          http response handler.
   */
  void removeVote(String annoId, ResponseHandler respHandler);

  /**
   * Remove follow up for an annotation.
   * 
   * @param followUpId
   *          follow up id.
   * @param respHandler
   *          http response handler.
   */
  void removeFollowup(String followUpId, ResponseHandler respHandler);

}
