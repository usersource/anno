//
//  AnnoUtils.h
//  UserSource
//
//  Created by Imran Ahmed on 08/04/14.
//

#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

@interface AnnoUtils : NSObject

- (NSString*) isLandscapeOrPortrait:(UIImage*)drawableImage;
- (UIImage*) rotateImage:(UIImage*)image rotatedByDegrees:(CGFloat)degrees;
- (NSString*) saveImageToTemp:(UIImage*)image;
- (void) mkdirs:(NSString*)path;
- (BOOL) isAnno:(NSString*)bundleID;
- (NSString*) getAppName;
- (NSString*) getAppVersion;
- (NSString*) generateScreenshotName;
- (UIImage*) takeScreenshot;
- (NSString*) takeScreenshotAndSaveToFile;
- (void) displayError:(NSString*)message;
- (void) triggerCreateAnno:(UIViewController*)viewController;
- (NSString*) generateUniqueImageKey;

@property NSString *ANNO_SOURCE_PLUGIN;
@property NSString *ANNO_SOURCE_STANDALONE;
@property Boolean debugEnabled;

@property NSString *INTENT_EXTRA_IS_PRACTICE;
@property NSString *UNKNOWN_APP_NAME;

@property NSString *SCREENSHOT_TIME_FORMAT;
@property NSString *PNG_SUFFIX;
@property NSString *LEVEL;
@property NSString *FAIL_CREATE_DIRECTORY;
@property NSString *ERROR_TITLE;

@property NSString *dataLocation;
@property NSString *screenshotDirName;

@property NSString *ANNO_PACKAGE_NAME;

@property NSString *IMAGE_ORIENTATION_PORTRAIT;
@property NSString *IMAGE_ORIENTATION_LANDSCAPE;

@property NSString *PROJECT_NAME;

@end
