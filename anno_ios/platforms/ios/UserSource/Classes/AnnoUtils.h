#import <Foundation/Foundation.h>

@interface AnnoUtils : NSObject

typedef void(^completionFunction)(NSError* error);

- (NSString*) isLandscapeOrPortrait:(UIImage*)drawableImage;
- (UIImage*) rotateImage:(UIImage*)drawableImage degree:(int)degree;
- (void) saveImage:(UIImage*)image inAlbum:(NSString*)album completionBlock:(completionFunction)completionBlock;

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
