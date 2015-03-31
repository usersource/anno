//
//  AnnoCordovaPlugin.m
//  UserSource
//
//  Created by Imran Ahmed on 11/04/14.
//

#import "AnnoCordovaPlugin.h"
#import "AnnoSingleton.h"

@implementation AnnoCordovaPlugin

@synthesize communityViewController;

NSString *ACTIVITY_INTRO = @"Intro";
NSString *ACTIVITY_FEEDBACK = @"Feedback";
float COMPRESSION_QUALITY = 0.7;

//AnnoUtils *annoUtils;
//ScreenshotGestureListener *screenshotGestureListener;
AnnoSingleton *annoSingleton;

- (void) pluginInitialize {
    annoSingleton = (AnnoSingleton*)[AnnoSingleton sharedInstance];
    annoSingleton.annoPlugin = self;

    annoUtils = [[AnnoUtils alloc] init];
}

- (void) exit_current_activity:(CDVInvokedUrlCommand*)command {
    [annoSingleton exitActivity];
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
                      cancelButtonTitle:@"OK"
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
        [annoSingleton exitActivity];
        [annoSingleton showCommunityPage];
    } @catch (NSException *exception) {
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
        [annoSingleton exitActivity];
    }
    
    @try {
        if ([activityName isEqualToString:ACTIVITY_INTRO]) {
            [annoSingleton showIntroPage];
        } else if ([activityName isEqualToString:ACTIVITY_FEEDBACK]) {
            [annoSingleton showOptionFeedback];
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
        [annoSingleton showAnnoDraw:imageURI levelValue:0 editModeValue:FALSE landscapeModeValue:NO];
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
        [annoSingleton showAnnoDraw:@"" levelValue:0 editModeValue:TRUE landscapeModeValue:landscapeModeValue];
    }
    @catch (NSException *exception) {
        NSLog(@"Exception in start_anno_draw: %@", exception);
    }

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) get_screenshot_path:(CDVInvokedUrlCommand*)command {
    AnnoDrawViewController *currentAnnoDrawViewController = [annoSingleton.annoDrawViewControllerList lastObject];
    NSString *level = [NSString stringWithFormat:@"%d", [currentAnnoDrawViewController getLevel]];
    BOOL isAnno = [annoUtils isAnno:[[NSBundle mainBundle] bundleIdentifier]];

    NSDictionary *jsonData = @{
        @"screenshotPath" : [currentAnnoDrawViewController getScreenshotPath],
        @"level" : level,
        @"isAnno" : [NSNumber numberWithBool:isAnno],
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
            @"screenInfo" : annoSingleton.viewControllerString,
            @"success" : @true
        };

        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                          messageAsString:(NSString*)jsonData];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        annoSingleton.newAnnoCreated = TRUE;
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
        AnnoDrawViewController *currentAnnoDrawViewController = [annoSingleton.annoDrawViewControllerList lastObject];
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
    AnnoDrawViewController *currentAnnoDrawViewController = [annoSingleton.annoDrawViewControllerList lastObject];
    
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
    [annoSingleton exitActivity];
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
    [annoUtils triggerCreateAnno:[annoSingleton.viewControllerList lastObject]];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) get_app_version:(CDVInvokedUrlCommand*)command {
    NSString *app_version = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"];
    NSString *app_build = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"];

    NSMutableArray *args = [[NSMutableArray alloc] init];
    [args addObject:app_version];
    [args addObject:app_build];

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:(NSString*)args];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) is_plugin:(CDVInvokedUrlCommand*)command {
    NSMutableArray *args = [[NSMutableArray alloc] init];
    [args addObject:[NSNumber numberWithBool:annoSingleton.isPlugin]];

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:(NSString*)args];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) get_user_info:(CDVInvokedUrlCommand*)command {
    NSArray *args = [[NSArray alloc] initWithObjects:annoSingleton.email, annoSingleton.displayName, annoSingleton.userImageURL, annoSingleton.teamKey, annoSingleton.teamSecret, nil];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:(NSString*)args];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) get_unread_count:(CDVInvokedUrlCommand*)command {
    NSDictionary *unreadData = [annoSingleton getUnreadData];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:(NSString*)unreadData];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) get_shake_settings:(CDVInvokedUrlCommand*)command {
    NSDictionary *args = @{
        @"allow_shake" : [NSNumber numberWithBool:annoSingleton.allowShake],
        @"shake_value" : [NSNumber numberWithInteger:annoSingleton.shakeValue]
    };

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:(NSString*)args];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) save_allow_shake:(CDVInvokedUrlCommand*)command {
    [annoSingleton saveAllowShake:[command.arguments objectAtIndex:0]];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) save_shake_value:(CDVInvokedUrlCommand*)command {
    [annoSingleton saveShakeValue:[[command.arguments objectAtIndex:0] integerValue]];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nil];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

@end
