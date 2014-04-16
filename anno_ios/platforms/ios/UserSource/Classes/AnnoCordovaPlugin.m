#import "AnnoCordovaPlugin.h"

@implementation AnnoCordovaPlugin

NSString *ACTIVITY_INTRO = @"Intro";
NSString *ACTIVITY_FEEDBACK = @"Feedback";

- (id) init {
    self = [super init];
    return self;
}

/*!
 This method shows community page
 Set appdelegate's viewController to communityViewController
 */
- (void) showCommunityPage {
    AppDelegate *appDelegate = [[UIApplication sharedApplication] delegate];
    CommunityViewController *currentViewController = (CommunityViewController*)appDelegate.communityViewController;

    if (self.viewController == nil && currentViewController.isViewLoaded) {
        self.viewController = currentViewController;
    } else {
        [self.viewController presentViewController:currentViewController animated:YES completion:nil];
    }
}

/*!
 This method shows intro page
 Set appdelegate's viewController to introViewController
 */
- (void) ShowIntroPage {
    AppDelegate *appDelegate = [[UIApplication sharedApplication] delegate];

    if (appDelegate.introViewController == nil) {
        #if __has_feature(objc_arc)
            appDelegate.introViewController = [[IntroViewController alloc] init];
        #else
            appDelegate.introViewController = [[[IntroViewController alloc] init] autorelease];
        #endif
        
        [appDelegate.window addSubview:appDelegate.introViewController.view];
        self.viewController = appDelegate.introViewController;
    } else {
        IntroViewController *currentViewController = (IntroViewController*)appDelegate.introViewController;
        [appDelegate.viewController presentViewController:currentViewController animated:YES completion:nil];
    }
}

/*!
 This method shows feedback page
 Set appdelegate's viewController to optionFeedbackViewController
 */
- (void) showOptionFeedback {
    AppDelegate *appDelegate = [[UIApplication sharedApplication] delegate];

    if (appDelegate.optionFeedbackViewController == nil) {
        #if __has_feature(objc_arc)
            appDelegate.optionFeedbackViewController = [[OptionFeedbackViewController alloc] init];
        #else
            appDelegate.optionFeedbackViewController = [[[OptionFeedbackViewController alloc] init] autorelease];
        #endif
        
        [appDelegate.window addSubview:appDelegate.optionFeedbackViewController.view];
        self.viewController = appDelegate.optionFeedbackViewController;
    } else {
        OptionFeedbackViewController *currentViewController = (OptionFeedbackViewController*)appDelegate.optionFeedbackViewController;
        [appDelegate.viewController presentViewController:currentViewController animated:YES completion:nil];
    }
}

/*!
 This method shows annodraw page
 Set appdelegate's viewController to annoDrawViewController
 */
- (void) showAnnoDraw:(NSString*)imageURI {
    AppDelegate *appDelegate = [[UIApplication sharedApplication] delegate];
    
    if (appDelegate.annoDrawViewController == nil) {
        #if __has_feature(objc_arc)
            appDelegate.annoDrawViewController = [[AnnoDrawViewController alloc] init];
        #else
            appDelegate.annoDrawViewController = [[[AnnoDrawViewController alloc] init] autorelease];
        #endif
        
        [appDelegate.window addSubview:appDelegate.annoDrawViewController.view];
        self.viewController = appDelegate.annoDrawViewController;
        [AnnoDrawViewController handleFromShareImage:imageURI levelValue:0 isPracticeValue:false];
    } else {
        AnnoDrawViewController *currentViewController = (AnnoDrawViewController*)appDelegate.annoDrawViewController;
        [appDelegate.viewController presentViewController:currentViewController animated:YES completion:nil];
    }
}

- (void) exitActivity {
    AppDelegate *appDelegate = [[UIApplication sharedApplication] delegate];

    if (self.viewController == appDelegate.communityViewController) {
        [appDelegate.communityViewController.view removeFromSuperview];
        appDelegate.communityViewController = nil;
    } else if (self.viewController == appDelegate.introViewController) {
        [appDelegate.introViewController.view removeFromSuperview];
        appDelegate.introViewController = nil;
    } else if (self.viewController == appDelegate.optionFeedbackViewController) {
        [appDelegate.optionFeedbackViewController.view removeFromSuperview];
        appDelegate.optionFeedbackViewController = nil;
    } else if (self.viewController == appDelegate.annoDrawViewController) {
        [appDelegate.annoDrawViewController.view removeFromSuperview];
        appDelegate.annoDrawViewController = nil;
    }

    self.viewController = nil;
}

/*!
 This method is used to exit app.
 In iOS, there is no way to exit app programmatically.
 */
- (void) exit_current_activity:(CDVInvokedUrlCommand*)command {
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        [self exitActivity];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

/*!
 This method show alertView instead of toast as toast doesn't exit in iOS
 */
- (void) show_toast:(CDVInvokedUrlCommand*)command {
    NSString* message = [command.arguments objectAtIndex:0];
    AppDelegate *appDelegate = [[UIApplication sharedApplication] delegate];

    UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:appDelegate.annoUtils.PROJECT_NAME
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
        AppDelegate *appDelegate = [[UIApplication sharedApplication] delegate];

        NSString *screenshotPath = [AnnoDrawViewController getScreenshotPath];
        NSString *level = [NSString stringWithFormat:@"%d", [AnnoDrawViewController getLevel]];
        NSString *isAnno = [appDelegate.annoUtils isAnno:[[NSBundle mainBundle] bundleIdentifier]] ? @"true" : @"false";
        NSString *payload = [NSString stringWithFormat:@"%@|%@|%@", screenshotPath, level, isAnno];

        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                          messageAsString:payload];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) get_anno_screenshot_path:(CDVInvokedUrlCommand*)command {
    AppDelegate *appDelegate = [[UIApplication sharedApplication] delegate];
    
    NSString *appLocation = appDelegate.annoUtils.dataLocation;
    NSString *screenshotDirName = appDelegate.annoUtils.screenshotDirName;
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
    AppDelegate *appDelegate = [[UIApplication sharedApplication] delegate];
    
    if ([args count] > 0) {
        base64Str = [args objectAtIndex:0];
    }

    NSString *appLocation = appDelegate.annoUtils.dataLocation;
    NSString *screenshotDirName = appDelegate.annoUtils.screenshotDirName;
    NSString *screenshotDirPath = [appLocation stringByAppendingPathComponent:screenshotDirName];
    [appDelegate.annoUtils mkdirs:screenshotDirPath];
    
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
    AppDelegate *appDelegate = [[UIApplication sharedApplication] delegate];
    
    if ([appDelegate.annoUtils isAnno:[[NSBundle mainBundle] bundleIdentifier]] && ([AnnoDrawViewController getLevel] != 2)) {
        source = appDelegate.annoUtils.ANNO_SOURCE_STANDALONE;
        appName = appDelegate.annoUtils.UNKNOWN_APP_NAME;
    } else {
        source = appDelegate.annoUtils.ANNO_SOURCE_PLUGIN;
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

@end
