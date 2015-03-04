//
//  AnnoDrawViewController.m
//  UserSource
//
//  Created by Imran Ahmed on 08/04/14.
//

#import "AnnoDrawViewController.h"
#import "AnnoCordovaPlugin.h"

@implementation AnnoDrawViewController

extern AnnoUtils* annoUtils;
@synthesize isPractice, editMode, level, screenshotPath, landscapeMode;

- (id)initWithNibName:(NSString*)nibNameOrNil bundle:(NSBundle*)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        self.startPage = @"anno/pages/annodraw/main.html";
        level = 0;
        screenshotPath = @"";
        landscapeMode = NO;
        // Uncomment to override the CDVCommandDelegateImpl used
        // _commandDelegate = [[AnnoDrawCommandDelegate alloc] initWithViewController:self];
        // Uncomment to override the CDVCommandQueue used
        // _commandQueue = [[AnnoDrawCommandQueue alloc] initWithViewController:self];
    }
    return self;
}

- (id)init
{
    self = [super init];
    if (self) {
        self.startPage = @"anno/pages/annodraw/main.html";
        level = 0;
        screenshotPath = @"";
        landscapeMode = NO;
        // Uncomment to override the CDVCommandDelegateImpl used
        // _commandDelegate = [[AnnoDrawCommandDelegate alloc] initWithViewController:self];
        // Uncomment to override the CDVCommandQueue used
        // _commandQueue = [[AnnoDrawCommandQueue alloc] initWithViewController:self];
    }
    return self;
}

- (void) makeLandscape {
    landscapeMode = YES;
    [[UIApplication sharedApplication] setStatusBarOrientation:UIInterfaceOrientationLandscapeRight animated:YES];
    UIViewController *c = [[UIViewController alloc] init];
    [self presentViewController:c animated:NO completion:nil];
    [self dismissViewControllerAnimated:NO completion:nil];
}

/**
 Saves URL of image which is to be shared via UserSource
 @param imageURI
        URL of image which is to be shared
 @param levelValue
        level value for viewcontroller
 @param isPracticeValue
        YES if it is for practice else NO
 @param editModeValue
        YES if it for editing anno item else NO
 */
- (void) handleFromShareImage:(NSString *)imageURI
                   levelValue:(int)levelValue
              isPracticeValue:(BOOL)isPracticeValue
                editModeValue:(BOOL)editModeValue
           landscapeModeValue:(BOOL)landscapeModeValue {

    if (editModeValue) {
        editMode = editModeValue;
        if (landscapeModeValue) {
            [self makeLandscape];
        }
        return;
    }

    screenshotPath = @"";
    level = levelValue + 1;
    isPractice = isPracticeValue;
    editMode = editModeValue;
    
    if (imageURI != nil) {
        // getting UIImage of specified image
        // for this, first we are getting NSData of image using URL of image
        // and then we are making UIImage from NSData
        UIImage *drawableImage = [UIImage imageWithData:[NSData dataWithContentsOfURL:[NSURL URLWithString:imageURI]]];
        
        @try {
            NSString *orientation = [annoUtils isLandscapeOrPortrait:drawableImage];
            if ([annoUtils.IMAGE_ORIENTATION_LANDSCAPE isEqualToString:orientation]) {
                [self makeLandscape];
                /* // rotating image by 90 degrees if image is landscape
                drawableImage = [annoUtils rotateImage:drawableImage rotatedByDegrees:90.0];

                // saving rotated image in 'tmp' directory
                screenshotPath = [annoUtils saveImageToTemp:drawableImage];
            } else {
                screenshotPath = imageURI;*/
            }
            screenshotPath = imageURI;
        }
        @catch (NSException *exception) {
            if (annoUtils.debugEnabled) {
                NSLog(@"Exception while handling from share image: %@", exception);
            }
        }
    }
}

/**
 Get screenshot path associated with that viewcontroller
 @return path of screenshot
 */
- (NSString*) getScreenshotPath {
    return screenshotPath;
}

/**
 Get level associated with that viewcontroller
 @return value of level
 */
- (int) getLevel {
    return level;
}

/**
 Get editMode value associated with that viewcontroller
 @return value of editMode
 */
- (BOOL) isEditMode {
    return editMode;
}

/**
 Set level value associated with viewcontroller
 @param levelValue
        value for level
 */
- (void) setLevel:(int)levelValue {
    level = levelValue;
}

- (void) setEditMode:(BOOL)editModeValue {
    editMode = editModeValue;
}

- (void)didReceiveMemoryWarning
{
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];

    // Release any cached data, images, etc that aren't in use.
}

#pragma mark View lifecycle

- (void) setUIConstraint {
    titleLabel.translatesAutoresizingMaskIntoConstraints = NO;
    poweredLabel.translatesAutoresizingMaskIntoConstraints = NO;
    imageView.translatesAutoresizingMaskIntoConstraints = NO;
    
    NSDictionary *views  = NSDictionaryOfVariableBindings(titleLabel, poweredLabel, imageView);
    
    [splashView addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[titleLabel]-0-|"
                                                                       options:0
                                                                       metrics:nil
                                                                         views:views]];

    int verticalSpace = (self.view.frame.size.height - 50) / 2;
    NSString *verticalConstraint = [NSString stringWithFormat:@"V:|-%d-[titleLabel(50)]-%d-|", verticalSpace, verticalSpace];
    [splashView addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:verticalConstraint
                                                                       options:0
                                                                       metrics:nil
                                                                         views:views]];

    [splashView addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:[imageView]-15-|"
                                                                       options:0
                                                                       metrics:nil
                                                                         views:views]];
    
    [splashView addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[imageView]-15-|"
                                                                       options:0
                                                                       metrics:nil
                                                                         views:views]];
    
    [splashView addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:[poweredLabel]-15-|"
                                                                       options:0
                                                                       metrics:nil
                                                                         views:views]];
    
    [splashView addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[poweredLabel]-15-|"
                                                                       options:0
                                                                       metrics:nil
                                                                         views:views]];
}

- (void) setSplashScreen {
    splashView = [[UIView alloc] initWithFrame:self.view.frame];
    splashView.backgroundColor = [UIColor colorWithRed:15/255.0 green:17/255.0 blue:22/255.0 alpha:1.0];
    [self.view addSubview:splashView];
    
    titleLabel = [[UILabel alloc] init];
    titleLabel.text = @"In-App Feedback";
    titleLabel.textColor = [UIColor whiteColor];
    titleLabel.textAlignment = NSTextAlignmentCenter;
    titleLabel.font = [UIFont systemFontOfSize:24.0];
    [splashView addSubview:titleLabel];
    
    poweredLabel = [[UILabel alloc] init];
    poweredLabel.text = @"Powered by UserSource.io";
    poweredLabel.textColor = [UIColor whiteColor];
    poweredLabel.font = [UIFont systemFontOfSize:14.0];
    [splashView addSubview:poweredLabel];
    
    imageView = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"usersource_logo"]];
    imageView.hidden = YES;
    [splashView addSubview:imageView];
    
    [self setUIConstraint];
}

- (void) viewWillAppear:(BOOL)animated {
    // View defaults to full size.  If you want to customize the view's size, or its subviews (e.g. webView),
    // you can do so here.
    [super viewWillAppear:animated];
}

- (void) viewDidLoad {
    [super viewDidLoad];

    if ((![@"io.usersource.anno" isEqualToString:[[NSBundle mainBundle] bundleIdentifier]])) {
        [self setSplashScreen];
    }

    NSArray *versionCompatibility = [[UIDevice currentDevice].systemVersion componentsSeparatedByString:@"."];
    NSInteger iOSVersion = [[versionCompatibility objectAtIndex:0] intValue];

    if (iOSVersion >= 7) {
        CGFloat viewWidth = self.view.frame.size.width;
        CGFloat viewHeight = self.view.frame.size.height;
        [self.webView setFrame:CGRectMake(0, 20, viewWidth, viewHeight - 20)];
    }
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // Return YES for supported orientations
    return [super shouldAutorotateToInterfaceOrientation:interfaceOrientation];
}

- (NSUInteger) supportedInterfaceOrientations {
    if (landscapeMode) {
        return UIInterfaceOrientationMaskLandscape;
    } else {
        return UIInterfaceOrientationMaskPortrait;
    }
}

- (BOOL)shouldAutorotate {
    return YES;
}

/* Comment out the block below to over-ride */

/*
- (UIWebView*) newCordovaViewWithFrame:(CGRect)bounds
{
    return[super newCordovaViewWithFrame:bounds];
}
*/

#pragma mark UIWebDelegate implementation

- (void)webViewDidFinishLoad:(UIWebView*)theWebView
{
    dispatch_time_t delay = dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC * 1);
    dispatch_after(delay, dispatch_get_main_queue(), ^(void){
        [UIView animateWithDuration:2.0f animations:^{
            [splashView setAlpha:0.0f];
        } completion:^(BOOL finished){
            splashView.hidden = YES;
        }];
    });
    return [super webViewDidFinishLoad:theWebView];
}

/* Comment out the block below to over-ride */

/*

- (void) webViewDidStartLoad:(UIWebView*)theWebView
{
    return [super webViewDidStartLoad:theWebView];
}

- (void) webView:(UIWebView*)theWebView didFailLoadWithError:(NSError*)error
{
    return [super webView:theWebView didFailLoadWithError:error];
}

- (BOOL) webView:(UIWebView*)theWebView shouldStartLoadWithRequest:(NSURLRequest*)request navigationType:(UIWebViewNavigationType)navigationType
{
    return [super webView:theWebView shouldStartLoadWithRequest:request navigationType:navigationType];
}
*/

- (UIStatusBarStyle) preferredStatusBarStyle {
    return UIStatusBarStyleLightContent;
}

@end

@implementation AnnoDrawCommandDelegate

/* To override the methods, uncomment the line in the init function(s)
   in AnnoDrawViewController.m
 */

#pragma mark CDVCommandDelegate implementation

- (id)getCommandInstance:(NSString*)className
{
    return [super getCommandInstance:className];
}

/*
   NOTE: this will only inspect execute calls coming explicitly from native plugins,
   not the commandQueue (from JavaScript). To see execute calls from JavaScript, see
   AnnoDrawCommandQueue below
*/
/*- (BOOL)execute:(CDVInvokedUrlCommand*)command
{
    return [super execute:command];
}*/

- (NSString*)pathForResource:(NSString*)resourcepath;
{
    return [super pathForResource:resourcepath];
}

@end

@implementation AnnoDrawCommandQueue

/* To override, uncomment the line in the init function(s)
   in AnnoDrawViewController.m
 */
- (BOOL)execute:(CDVInvokedUrlCommand*)command
{
    return [super execute:command];
}

@end
