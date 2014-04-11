#import <Cordova/CDV.h>
#import "AppDelegate.h"
#import "AnnoDrawViewController.h"
#import "CommunityViewController.h"
#import "IntroViewController.h"
#import "OptionFeedbackViewController.h"

@interface AnnoCordovaPlugin : CDVPlugin {
    int COMPRESS_QUALITY;
}

- (void) exit_current_activity:(CDVInvokedUrlCommand*)command;
- (void) show_toast:(CDVInvokedUrlCommand*)command;
- (void) goto_anno_home:(CDVInvokedUrlCommand*)command;
- (void) start_activity:(CDVInvokedUrlCommand*)command;
- (void) process_image_and_appinfo:(CDVInvokedUrlCommand*)command;
- (void) start_anno_draw:(CDVInvokedUrlCommand*)command;
- (void) get_screenshot_path:(CDVInvokedUrlCommand*)command;

- (void)show_softkeyboard:(CDVInvokedUrlCommand*)command;
- (void)exit_intro:(CDVInvokedUrlCommand*)command;
- (void)get_recent_applist:(CDVInvokedUrlCommand*)command;
- (void)get_anno_screenshot_path:(CDVInvokedUrlCommand*)command;
- (void)close_softkeyboard:(CDVInvokedUrlCommand*)command;
- (void)Intro:(CDVInvokedUrlCommand*)command;
- (void)Community:(CDVInvokedUrlCommand*)command;
- (void)Feedback:(CDVInvokedUrlCommand*)command;
- (void)AnnoDraw:(CDVInvokedUrlCommand*)command;

@end
