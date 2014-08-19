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

NSMutableArray *viewControllerList;

CommunityViewController *communityViewController;
AnnoDrawViewController *annoDrawViewController;
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
}

- (void) showCommunityPage {
    CDVViewController *currentViewController = [viewControllerList objectAtIndex:0];

    if (currentViewController != communityViewController) {
        [currentViewController presentViewController:communityViewController animated:YES completion:nil];
        [viewControllerList insertObject:communityViewController atIndex:0];
    }
}

- (void) ShowIntroPage {
    if (introViewController == nil) {
        introViewController = [[IntroViewController alloc] init];
        [appDelegate.window addSubview:introViewController.view];
    } else {
        [appDelegate.viewController presentViewController:introViewController animated:YES completion:nil];
    }

    [viewControllerList insertObject:introViewController atIndex:0];
}

- (void) showOptionFeedback {
    if (optionFeedbackViewController == nil) {
        optionFeedbackViewController = [[OptionFeedbackViewController alloc] init];
        [appDelegate.window addSubview:optionFeedbackViewController.view];
    } else {
        [appDelegate.viewController presentViewController:optionFeedbackViewController animated:YES completion:nil];
    }

    [viewControllerList insertObject:optionFeedbackViewController atIndex:0];
}

+ (void) showAnnoDraw:(NSString*)imageURI levelValue:(int)levelValue editModeValue:(BOOL)editModeValue {
    if (annoDrawViewController == nil) {
        annoDrawViewController = [[AnnoDrawViewController alloc] init];
        [appDelegate.window addSubview:annoDrawViewController.view];
        [annoDrawViewController handleFromShareImage:imageURI
                                          levelValue:levelValue
                                     isPracticeValue:false
                                       editModeValue:editModeValue];
    } else {
        [appDelegate.viewController presentViewController:annoDrawViewController animated:YES completion:nil];
    }

    [viewControllerList insertObject:annoDrawViewController atIndex:0];
}

- (void) exitActivity {
    CDVViewController *currentViewController = [viewControllerList objectAtIndex:0];

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

    [viewControllerList removeObjectAtIndex:0];
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
        [AnnoCordovaPlugin showAnnoDraw:imageURI levelValue:0 editModeValue:FALSE];
    }
    @catch (NSException *exception) {
        NSLog(@"Exception in start_anno_draw: %@", exception);
    }

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) start_edit_anno_draw:(CDVInvokedUrlCommand*)command {
    @try {
        [AnnoCordovaPlugin showAnnoDraw:@"" levelValue:0 editModeValue:TRUE];
    }
    @catch (NSException *exception) {
        NSLog(@"Exception in start_anno_draw: %@", exception);
    }

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) get_screenshot_path:(CDVInvokedUrlCommand*)command {
    NSString *level = [NSString stringWithFormat:@"%d", [annoDrawViewController getLevel]];
    NSString *isAnno = [annoUtils isAnno:[[NSBundle mainBundle] bundleIdentifier]] ? @"true" : @"false";

    NSDictionary *jsonData = @{
        @"screenshotPath" : [annoDrawViewController getScreenshotPath],
        @"level" : level,
        @"isAnno" : isAnno,
        @"editMode" : [NSNumber numberWithBool:[annoDrawViewController isEditMode]]
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
        imageData = [NSData dataWithContentsOfURL:[NSURL URLWithString:[annoDrawViewController getScreenshotPath]]];
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
    
    if ([annoUtils isAnno:[[NSBundle mainBundle] bundleIdentifier]] && ([annoDrawViewController getLevel] != 2)) {
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
        @"level" : [NSNumber numberWithInt:[annoDrawViewController getLevel]]
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
    [annoUtils triggerCreateAnno:[viewControllerList objectAtIndex:0]];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

@end
