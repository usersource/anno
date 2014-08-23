//
//  AnnoCordovaPlugin.m
//  UserSource
//
//  Created by Imran Ahmed on 11/04/14.
//

#import "AnnoCordovaPlugin.h"

@implementation AnnoCordovaPlugin

NSString *ACTIVITY_INTRO = @"Intro";
NSString *ACTIVITY_FEEDBACK = @"Feedback";
float COMPRESSION_QUALITY = 0.7;

AnnoUtils *annoUtils;
ScreenshotGestureListener *screenshotGestureListener;
AppDelegate *appDelegate;

NSMutableArray *viewControllerList, *annoDrawViewControllerList;

CommunityViewController *communityViewController;
IntroViewController *introViewController;
OptionFeedbackViewController *optionFeedbackViewController;

- (void) pluginInitialize {
    appDelegate = [[UIApplication sharedApplication] delegate];
    annoUtils = [[AnnoUtils alloc] init];
    screenshotGestureListener = [[ScreenshotGestureListener alloc] init];

    if ([annoUtils isAnno:[[NSBundle mainBundle] bundleIdentifier]]) {
        communityViewController = [appDelegate valueForKey:@"communityViewController"];
    } else {
        communityViewController = [[CommunityViewController alloc] init];
    }

    viewControllerList = [NSMutableArray arrayWithObjects:appDelegate.window.rootViewController, nil];
    annoDrawViewControllerList = [[NSMutableArray alloc] init];
}

- (void) showCommunityPage {
    CDVViewController *currentViewController = [viewControllerList lastObject];

    if (currentViewController != communityViewController) {
        [currentViewController presentViewController:communityViewController animated:YES completion:nil];
        [viewControllerList addObject:communityViewController];
    }
}

- (void) ShowIntroPage {
    if (introViewController == nil) {
        introViewController = [[IntroViewController alloc] init];
    }

    [[viewControllerList lastObject] presentViewController:introViewController animated:YES completion:nil];
    [viewControllerList addObject:introViewController];
}

- (void) showOptionFeedback {
    if (optionFeedbackViewController == nil) {
        optionFeedbackViewController = [[OptionFeedbackViewController alloc] init];
    }

    [[viewControllerList lastObject] presentViewController:optionFeedbackViewController animated:YES completion:nil];
    [viewControllerList addObject:optionFeedbackViewController];
}

+ (void) showAnnoDraw:(NSString*)imageURI
           levelValue:(int)levelValue
        editModeValue:(BOOL)editModeValue
   landscapeModeValue:(BOOL)landscapeModeValue {
    CDVViewController *currentViewController = [viewControllerList lastObject];
    AnnoDrawViewController *annoDrawViewController = [[AnnoDrawViewController alloc] init];
    [currentViewController presentViewController:annoDrawViewController animated:NO completion:nil];

    // Adding back lastObject of viewControllerList beacause it gets deleted after calling
    // presentViewController on lastObject of viewControllerList with annoDrawViewController
    if ([currentViewController isKindOfClass:[AnnoDrawViewController class]]) {
        [viewControllerList addObject:currentViewController];
        [annoDrawViewControllerList addObject:currentViewController];
    }

    [viewControllerList addObject:annoDrawViewController];
    [annoDrawViewControllerList addObject:annoDrawViewController];
    [annoDrawViewController handleFromShareImage:imageURI
                                      levelValue:levelValue
                                 isPracticeValue:false
                                   editModeValue:editModeValue
                              landscapeModeValue:landscapeModeValue];
}

- (void) exitActivity {
    CDVViewController *currentViewController = [viewControllerList lastObject];

    if ([currentViewController isKindOfClass:[CommunityViewController class]]) {
        [communityViewController dismissViewControllerAnimated:YES completion:nil];
        communityViewController = nil;
    } else if ([currentViewController isKindOfClass:[IntroViewController class]]) {
        [introViewController dismissViewControllerAnimated:YES completion:nil];
        introViewController = nil;
    } else if ([currentViewController isKindOfClass:[OptionFeedbackViewController class]]) {
        [optionFeedbackViewController dismissViewControllerAnimated:YES completion:nil];
        optionFeedbackViewController = nil;
    } else if ([currentViewController isKindOfClass:[AnnoDrawViewController class]]) {
        AnnoDrawViewController *currentAnnoDrawViewController = [annoDrawViewControllerList lastObject];
        [currentAnnoDrawViewController dismissViewControllerAnimated:YES completion:nil];
        currentAnnoDrawViewController = nil;
        [annoDrawViewControllerList removeLastObject];
    }

    [viewControllerList removeLastObject];
}

- (void) exit_current_activity:(CDVInvokedUrlCommand*)command {
    [self exitActivity];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

/*!
 This method show alertView instead of toast as toast doesn't exit in iOS
 */
- (void) show_toast:(CDVInvokedUrlCommand*)command {
    NSString *message = [command.arguments objectAtIndex:0];
    NSString *title = annoUtils.PROJECT_NAME;

    if ([command.arguments count] > 1) {
        title = [command.arguments objectAtIndex:1];
    }

    [[[UIAlertView alloc] initWithTitle:title
                                message:message
                               delegate:nil
                      cancelButtonTitle:@"Ok"
                      otherButtonTitles:nil] show];

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
    BOOL closeCurrentActivity = [[command.arguments objectAtIndex:1] boolValue];

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
    NSString *imageURI = [command.arguments objectAtIndex:0];

    @try {
        [AnnoCordovaPlugin showAnnoDraw:imageURI levelValue:0 editModeValue:FALSE landscapeModeValue:NO];
    }
    @catch (NSException *exception) {
        NSLog(@"Exception in start_anno_draw: %@", exception);
    }

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) start_edit_anno_draw:(CDVInvokedUrlCommand*)command {
    @try {
        BOOL landscapeModeValue = [[command.arguments objectAtIndex:0] boolValue];
        [AnnoCordovaPlugin showAnnoDraw:@"" levelValue:0 editModeValue:TRUE landscapeModeValue:landscapeModeValue];
    }
    @catch (NSException *exception) {
        NSLog(@"Exception in start_anno_draw: %@", exception);
    }

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) get_screenshot_path:(CDVInvokedUrlCommand*)command {
    AnnoDrawViewController *currentAnnoDrawViewController = [annoDrawViewControllerList lastObject];
    NSString *level = [NSString stringWithFormat:@"%d", [currentAnnoDrawViewController getLevel]];
    NSString *isAnno = [annoUtils isAnno:[[NSBundle mainBundle] bundleIdentifier]] ? @"true" : @"false";

    NSDictionary *jsonData = @{
        @"screenshotPath" : [currentAnnoDrawViewController getScreenshotPath],
        @"level" : level,
        @"isAnno" : isAnno,
        @"editMode" : [NSNumber numberWithBool:[currentAnnoDrawViewController isEditMode]]
    };

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsString:(NSString*)jsonData];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
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
    
    NSString *imageKey = [annoUtils generateUniqueImageKey];
    NSData *imageData;
    
    if ([base64Str length] > 0) {
        imageData = [[NSData alloc] initWithBase64Encoding:base64Str];
    } else {
        AnnoDrawViewController *currentAnnoDrawViewController = [annoDrawViewControllerList lastObject];
        imageData = [NSData dataWithContentsOfURL:[NSURL URLWithString:[currentAnnoDrawViewController getScreenshotPath]]];
    }

    UIImage *image = [UIImage imageWithData:imageData];
    NSString *fullPath = [screenshotDirPath stringByAppendingPathComponent:imageKey];
    
    [[NSFileManager defaultManager] createFileAtPath:fullPath
                                            contents:UIImageJPEGRepresentation(image, COMPRESSION_QUALITY)
                                          attributes:nil];

    return @{@"imageKey" : imageKey, @"screenshotPath" : screenshotDirPath};
}

- (NSDictionary*) getAppInfo {
    NSString *source, *appName;
    AnnoDrawViewController *currentAnnoDrawViewController = [annoDrawViewControllerList lastObject];
    
    if ([annoUtils isAnno:[[NSBundle mainBundle] bundleIdentifier]] && ([currentAnnoDrawViewController getLevel] != 2)) {
        source = annoUtils.ANNO_SOURCE_STANDALONE;
        appName = annoUtils.UNKNOWN_APP_NAME;
    } else {
        source = annoUtils.ANNO_SOURCE_PLUGIN;
        appName = [annoUtils getAppName];
    }
    
    NSString *appVersion = [annoUtils getAppVersion];
    
    NSDictionary * result = @{
        @"source" : source,
        @"appName" : appName,
        @"appVersion" : appVersion,
        @"level" : [NSNumber numberWithInt:[currentAnnoDrawViewController getLevel]]
    };
    
    return result;
}

- (void) exit_intro:(CDVInvokedUrlCommand*)command {
    [self exitActivity];
}

- (void) get_recent_applist:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) get_installed_app_list:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) show_softkeyboard:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) close_softkeyboard:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) enable_native_gesture_listener:(CDVInvokedUrlCommand*)command {
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) trigger_create_anno:(CDVInvokedUrlCommand*)command {
    [annoUtils triggerCreateAnno:[viewControllerList lastObject]];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

@end
