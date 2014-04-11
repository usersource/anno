#import "AnnoCordovaPlugin.h"

@implementation AnnoCordovaPlugin

NSString *ACTIVITY_INTRO = @"Intro";
NSString *ACTIVITY_FEEDBACK = @"Feedback";

//        EXIT_CURRENT_ACTIVITY= @"exit_current_activity";
//        SHOW_TOAST = @"show_toast";
//        GOTO_ANNO_HOME = @"goto_anno_home";
//
//        EXIT_INTRO= @"exit_intro";
//        PROCESS_IMAGE_AND_APPINFO = @"process_image_and_appinfo";
//        GET_RECENT_APPLIST = @"get_recent_applist";
//        GET_SCREENSHOT_PATH = @"get_screenshot_path";
//        GET_ANNO_SCREENSHOT_PATH = @"get_anno_screenshot_path";
//        START_ACTIVITY = @"start_activity";
//        CLOSE_SOFTKEYBOARD = @"close_softkeyboard";
//        SHOW_SOFTKEYBOARD = @"show_softkeyboard";
//        ACTIVITY_INTRO = @"Intro";
//        ACTIVITY_FEEDBACK = @"Feedback";
//        ACTIVITY_ANNODRAW = @"AnnoDraw";
//        ACTIVITY_COMMUNITY = @"Community";

- (id) init {
    self = [super init];
    if (self) {
        COMPRESS_QUALITY = 40;
    }

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
        [[AnnoDrawViewController class] handleFromShareImage:imageURI];
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
    UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:@"UserSource"
                                                        message:message
                                                       delegate:self
                                              cancelButtonTitle:@"Ok"
                                              otherButtonTitles:nil];
    [alertView show];
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
        NSString *payload = [[[AnnoDrawViewController class] getScreenshotPath] stringByAppendingString:@"|1|true"];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                          messageAsString:payload];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

/*!
 */
- (void) process_image_and_appinfo:(CDVInvokedUrlCommand*)command {
}

- (void)show_softkeyboard:(CDVInvokedUrlCommand*)command
{
    // Check command.arguments here.
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        // Some blocking logic...
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        // The sendPluginResult method is thread-safe.
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) exit_intro:(CDVInvokedUrlCommand*)command {
    // Check command.arguments here.
    /*[self.commandDelegate runInBackground:^{
        NSString* payload = nil;

        
        // load intro page
        AppDelegate* appDelegate = (AppDelegate*)[UIApplication sharedApplication].delegate;
        MainViewController* viewController = (MainViewController*)appDelegate.viewController;
        
        NSString *fullURL = [[NSBundle mainBundle] pathForResource:@"main" ofType:@"html" inDirectory:@"www/anno/pages/community"];
        NSURL *url = [NSURL fileURLWithPath:fullURL];
        NSURLRequest *requestObj = [NSURLRequest requestWithURL:url];
        [viewController.webView loadRequest:requestObj];
        
        // end load
        
        
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        // The sendPluginResult method is thread-safe.
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];*/
}

- (void)get_recent_applist:(CDVInvokedUrlCommand*)command
{
    // Check command.arguments here.
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        // Some blocking logic...
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        // The sendPluginResult method is thread-safe.
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void)get_anno_screenshot_path:(CDVInvokedUrlCommand*)command
{
    // Check command.arguments here.
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        // Some blocking logic...
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        // The sendPluginResult method is thread-safe.
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void)close_softkeyboard:(CDVInvokedUrlCommand*)command
{
    // Check command.arguments here.
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        // Some blocking logic...
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        // The sendPluginResult method is thread-safe.
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void)Intro:(CDVInvokedUrlCommand*)command
{
    // Check command.arguments here.
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        // Some blocking logic...
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        // The sendPluginResult method is thread-safe.
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void)Community:(CDVInvokedUrlCommand*)command
{
    // Check command.arguments here.
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        // Some blocking logic...
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        // The sendPluginResult method is thread-safe.
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void)Feedback:(CDVInvokedUrlCommand*)command
{
    // Check command.arguments here.
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        // Some blocking logic...
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        // The sendPluginResult method is thread-safe.
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void)AnnoDraw:(CDVInvokedUrlCommand*)command
{
    // Check command.arguments here.
    [self.commandDelegate runInBackground:^{
        NSString* payload = nil;
        // Some blocking logic...
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
        // The sendPluginResult method is thread-safe.
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (NSDictionary*) actionProcess {
    return false;
}

@end
