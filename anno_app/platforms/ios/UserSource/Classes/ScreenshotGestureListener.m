//
//  ScreenshotGestureListener.m
//  UserSource
//
//  Created by Imran Ahmed on 24/04/14.
//

#import "ScreenshotGestureListener.h"
#import "AnnoCordovaPlugin.h"

@implementation ScreenshotGestureListener

- (id) init {
    self = [super init];
    
    if (self) {
        self.TAKE_SCREENSHOT_FAIL_MESSAGE = @"Take Screenshot Failed.";
    }
    
    return self;
}

- (NSString*) takeScreenshot {
    UIImage *image = [annoUtils takeScreenshot];

    NSString *appLocation = annoUtils.dataLocation;
    NSString *screenshotDirName = annoUtils.screenshotDirName;
    NSString *screenshotDirPath = [appLocation stringByAppendingPathComponent:screenshotDirName];
    [annoUtils mkdirs:screenshotDirPath];

    NSString *screenshotName = [annoUtils generateScreenshotName];
    NSString *screenshotPath = [screenshotDirPath stringByAppendingPathComponent:screenshotName];
    [[NSFileManager defaultManager] createFileAtPath:screenshotPath
                                            contents:UIImagePNGRepresentation(image)
                                          attributes:nil];
    
    screenshotPath = [@"file://localhost" stringByAppendingString:[screenshotPath stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
    return screenshotPath;
}

- (void) launchAnnoPlugin:(UIViewController*)viewController screenshotPath:(NSString*)screenshotPath {
    int level = 0;
    
    if ([viewController isKindOfClass:[CommunityViewController class]] ||
        [viewController isKindOfClass:[AnnoDrawViewController class]] ||
        [viewController isKindOfClass:[IntroViewController class]] ||
        [viewController isKindOfClass:[OptionFeedbackViewController class]]) {
        level = 1;
    }
    
    [AnnoCordovaPlugin showAnnoDraw:screenshotPath levelValue:level editModeValue:FALSE];
}

@end
