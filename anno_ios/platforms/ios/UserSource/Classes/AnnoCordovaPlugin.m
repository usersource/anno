#import "AnnoCordovaPlugin.h"

@implementation AnnoCordovaPlugin

NSString *ACTIVITY_INTRO = @"Intro";
NSString *ACTIVITY_FEEDBACK = @"Feedback";

AnnoUtils *annoUtils;
AppDelegate *appDelegate;

UIViewController *currentViewController;
CDVViewController *communityViewController, *annoDrawViewController, *introViewController, *optionFeedbackViewController;

- (void) pluginInitialize {
    appDelegate = [[UIApplication sharedApplication] delegate];
    annoUtils = [[AnnoUtils alloc] init];

    if ([annoUtils isAnno:[[NSBundle mainBundle] bundleIdentifier]]) {
        communityViewController = [appDelegate valueForKey:@"communityViewController"];
    } else {
        #if __has_feature(objc_arc)
            communityViewController = [[CommunityViewController alloc] init];
        #else
            communityViewController = [[[CommunityViewController alloc] init] autorelease];
        #endif
    }

    currentViewController = appDelegate.window.rootViewController;
}

/*!
 This method shows community page
 Set appdelegate's viewController to communityViewController
 */
- (void) showCommunityPage {
    if (currentViewController != communityViewController) {
        [currentViewController presentViewController:communityViewController animated:YES completion:nil];
    }
}

/*!
 This method shows intro page
 Set appdelegate's viewController to introViewController
 */
- (void) ShowIntroPage {
    if (introViewController == nil) {
        #if __has_feature(objc_arc)
            introViewController = [[IntroViewController alloc] init];
        #else
            introViewController = [[[IntroViewController alloc] init] autorelease];
        #endif
        
        [appDelegate.window addSubview:introViewController.view];
        currentViewController = introViewController;
    } else {
        [appDelegate.viewController presentViewController:introViewController animated:YES completion:nil];
    }
}

/*!
 This method shows feedback page
 Set appdelegate's viewController to optionFeedbackViewController
 */
- (void) showOptionFeedback {
    if (optionFeedbackViewController == nil) {
        #if __has_feature(objc_arc)
            optionFeedbackViewController = [[OptionFeedbackViewController alloc] init];
        #else
            optionFeedbackViewController = [[[OptionFeedbackViewController alloc] init] autorelease];
        #endif
        
        [appDelegate.window addSubview:optionFeedbackViewController.view];
        currentViewController = optionFeedbackViewController;
    } else {
        [appDelegate.viewController presentViewController:optionFeedbackViewController animated:YES completion:nil];
    }
}

/*!
 This method shows annodraw page
 Set appdelegate's viewController to annoDrawViewController
 */
- (void) showAnnoDraw:(NSString*)imageURI {
    if (annoDrawViewController == nil) {
        #if __has_feature(objc_arc)
            annoDrawViewController = [[AnnoDrawViewController alloc] init];
        #else
            annoDrawViewController = [[[AnnoDrawViewController alloc] init] autorelease];
        #endif
        
        [appDelegate.window addSubview:annoDrawViewController.view];
        currentViewController = annoDrawViewController;
        [AnnoDrawViewController handleFromShareImage:imageURI levelValue:0 isPracticeValue:false];
    } else {
        [appDelegate.viewController presentViewController:annoDrawViewController animated:YES completion:nil];
    }
}

- (void) exitActivity {
    if (currentViewController == communityViewController) {
        [communityViewController.view removeFromSuperview];
        communityViewController = nil;
    } else if (currentViewController == introViewController) {
        [introViewController.view removeFromSuperview];
        introViewController = nil;
    } else if (currentViewController == optionFeedbackViewController) {
        [optionFeedbackViewController.view removeFromSuperview];
        optionFeedbackViewController = nil;
    } else if (currentViewController == annoDrawViewController) {
        [annoDrawViewController.view removeFromSuperview];
        annoDrawViewController = nil;
    }

    currentViewController = appDelegate.window.rootViewController;
}

/*!
 This method is used to exit app.
 In iOS, there is no way to exit app programmatically.
 */
- (void) exit_current_activity:(CDVInvokedUrlCommand*)command {
    [self exitActivity];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

/*!
 This method show alertView instead of toast as toast doesn't exit in iOS
 */
- (void) show_toast:(CDVInvokedUrlCommand*)command {
    NSString* message = [command.arguments objectAtIndex:0];

    UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:annoUtils.PROJECT_NAME
                                                        message:message
                                                       delegate:self
                                              cancelButtonTitle:@"Ok"
                                              otherButtonTitles:nil];

    [alertView show];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

/*!
 This method show community page.
 This send callback result as success.
 */
- (void) goto_anno_home:(CDVInvokedUrlCommand*)command {
    NSString* payload = nil;
    
    @try {
        [self exitActivity];
        [self showCommunityPage];
    }
    @catch (NSException *exception) {
        NSLog(@"Exception in goto_anno_home: %@", exception);
    }
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

/*!
 This method show intro or feedback page depending on parameter passed.
 This send callback result as success.
 */
 
- (void) start_activity:(CDVInvokedUrlCommand*)command {
    NSString* payload = nil;
    NSString* activityName = [command.arguments objectAtIndex:0];
    BOOL closeCurrentActivity = (BOOL)[command.arguments objectAtIndex:1];

    if (closeCurrentActivity) {
        [self exitActivity];
    }
    
    @try {
        if ([activityName isEqualToString:ACTIVITY_INTRO]) {
            [self ShowIntroPage];
        } else if ([activityName isEqualToString:ACTIVITY_FEEDBACK]) {
            [self showOptionFeedback];
        }
    } @catch(NSException *exception) {
        NSLog(@"Exception in start_activity: %@", exception);
    }
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

/*!
 This method show anno draw page.
 This send callback result as success.
 */
- (void) start_anno_draw:(CDVInvokedUrlCommand*)command {
    NSString *payload = nil;
    NSString *imageURI = [command.arguments objectAtIndex:0];

    @try {
        [self showAnnoDraw:imageURI];
    }
    @catch (NSException *exception) {
        NSLog(@"Exception in start_anno_draw: %@", exception);
    }

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) get_screenshot_path:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        NSString *screenshotPath = [AnnoDrawViewController getScreenshotPath];
        NSString *level = [NSString stringWithFormat:@"%d", [AnnoDrawViewController getLevel]];
        NSString *isAnno = [annoUtils isAnno:[[NSBundle mainBundle] bundleIdentifier]] ? @"true" : @"false";
        NSString *payload = [NSString stringWithFormat:@"%@|%@|%@", screenshotPath, level, isAnno];

        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) get_anno_screenshot_path:(CDVInvokedUrlCommand*)command {
    NSString *appLocation = annoUtils.dataLocation;
    NSString *screenshotDirName = annoUtils.screenshotDirName;
    NSString *screenshotDirPath = [appLocation stringByAppendingPathComponent:screenshotDirName];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:screenshotDirPath];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) process_image_and_appinfo:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        NSDictionary *imageAttrs = [self doSaveImage:command.arguments];
        NSDictionary *appInfo = [self getAppInfo];
    
        NSDictionary *jsonData = @{
            @"imageAttrs" : imageAttrs,
            @"appInfo" : appInfo,
            @"success" : @true
        };

        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                          messageAsString:(NSString*)jsonData];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (NSDictionary*) doSaveImage:(NSArray*)args {
    NSString *base64Str = @"";
    
    if ([args count] > 0) {
        base64Str = [args objectAtIndex:0];
    }

    NSString *appLocation = annoUtils.dataLocation;
    NSString *screenshotDirName = annoUtils.screenshotDirName;
    NSString *screenshotDirPath = [appLocation stringByAppendingPathComponent:screenshotDirName];
    [annoUtils mkdirs:screenshotDirPath];
    
    NSString *imageKey = [self generateUniqueImageKey];
    NSData *imageData;
    
    if ([base64Str length] > 0) {
        imageData = [[NSData alloc] initWithBase64Encoding:base64Str];
    } else {
        imageData = [NSData dataWithContentsOfURL:[NSURL URLWithString:[AnnoDrawViewController getScreenshotPath]]];
    }

    UIImage *image = [UIImage imageWithData:imageData];
    NSString *fullPath = [screenshotDirPath stringByAppendingPathComponent:imageKey];
    
    [[NSFileManager defaultManager] createFileAtPath:fullPath
                                            contents:UIImagePNGRepresentation(image)
                                          attributes:nil];

    return @{@"imageKey" : imageKey, @"screenshotPath" : screenshotDirPath};
}

- (NSString*) generateUniqueImageKey {
    return (NSString*)CFBridgingRelease(CFUUIDCreateString(NULL, CFUUIDCreate(NULL)));
}

- (NSDictionary*) getAppInfo {
    NSString *source, *appName;
    
    if ([annoUtils isAnno:[[NSBundle mainBundle] bundleIdentifier]] && ([AnnoDrawViewController getLevel] != 2)) {
        source = annoUtils.ANNO_SOURCE_STANDALONE;
        appName = annoUtils.UNKNOWN_APP_NAME;
    } else {
        source = annoUtils.ANNO_SOURCE_PLUGIN;
        appName = [AnnoUtils getAppName];
    }
    
    NSString *appVersion = [AnnoUtils getAppVersion];
    
    NSDictionary * result = @{
        @"source" : source,
        @"appName" : appName,
        @"appVersion" : appVersion,
        @"level" : [NSNumber numberWithInt:[AnnoDrawViewController getLevel]]
    };
    
    return result;
}

- (void) exit_intro:(CDVInvokedUrlCommand*)command {
    [self exitActivity];
}

- (void) get_recent_applist:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) get_installed_app_list:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) show_softkeyboard:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) close_softkeyboard:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) enable_native_gesture_listener:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

@end
