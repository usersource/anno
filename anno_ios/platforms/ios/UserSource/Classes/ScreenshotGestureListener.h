//
//  ScreenshotGestureListener.h
//  UserSource
//
//  Created by Imran Ahmed on 24/04/14.
//
//

#import <Foundation/Foundation.h>

@interface ScreenshotGestureListener : NSObject

- (NSString*) takeScreenshot;
- (void) launchAnnoPlugin:(UIViewController*)viewController screenshotPath:(NSString*)screenshotPath;

@property NSString *TAKE_SCREENSHOT_FAIL_MESSAGE;

@end
