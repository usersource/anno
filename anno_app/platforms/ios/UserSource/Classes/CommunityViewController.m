//
//  CommunityViewController.m
//  UserSource
//
//  Created by Imran Ahmed on 08/04/14.
//

#import "CommunityViewController.h"

@implementation CommunityViewController

int level;

- (id)initWithNibName:(NSString*)nibNameOrNil bundle:(NSBundle*)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        self.startPage = @"anno/pages/community/main.html";
        level = 0;
        // Uncomment to override the CDVCommandDelegateImpl used
        // _commandDelegate = [[CommunityCommandDelegate alloc] initWithViewController:self];
        // Uncomment to override the CDVCommandQueue used
        // _commandQueue = [[CommunityCommandQueue alloc] initWithViewController:self];
    }
    return self;
}

- (id) init {
    self = [super init];
    if (self) {
        self.startPage = @"anno/pages/community/main.html";
        level = 0;
        // Uncomment to override the CDVCommandDelegateImpl used
        // _commandDelegate = [[CommunityCommandDelegate alloc] initWithViewController:self];
        // Uncomment to override the CDVCommandQueue used
        // _commandQueue = [[CommunityCommandQueue alloc] initWithViewController:self];
    }
    return self;
}

/**
 Get level associated with that viewcontroller
 @return value of level
 */
- (int) getLevel {
    return level;
}

/**
 Set level value associated with viewcontroller
 @param levelValue
 value for level
 */
- (void) setLevel:(int)levelValue {
    level = levelValue;
}

- (void)didReceiveMemoryWarning
{
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];

    // Release any cached data, images, etc that aren't in use.
}

#pragma mark View lifecycle

- (void) viewWillAppear:(BOOL)animated {
    // View defaults to full size.  If you want to customize the view's size, or its subviews (e.g. webView),
    // you can do so here.
    [super viewWillAppear:animated];
}

- (void) setUIConstraint {
    [titleLabel setTranslatesAutoresizingMaskIntoConstraints:NO];
    [poweredLabel setTranslatesAutoresizingMaskIntoConstraints:NO];

    [splashView addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[titleLabel]-0-|"
                                                                       options:0
                                                                       metrics:nil
                                                                         views:NSDictionaryOfVariableBindings(titleLabel)]];

    int verticalSpace = (self.view.frame.size.height - 50) / 2;
    NSString *verticalConstraint = [NSString stringWithFormat:@"V:|-%d-[titleLabel(50)]-%d-|", verticalSpace, verticalSpace];
    [splashView addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:verticalConstraint
                                                                       options:0
                                                                       metrics:nil
                                                                         views:NSDictionaryOfVariableBindings(titleLabel)]];

    [splashView addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:[poweredLabel]-15-|"
                                                                       options:0
                                                                       metrics:nil
                                                                         views:NSDictionaryOfVariableBindings(poweredLabel)]];

    [splashView addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[poweredLabel]-15-|"
                                                                       options:0
                                                                       metrics:nil
                                                                         views:NSDictionaryOfVariableBindings(poweredLabel)]];
}

- (void) setSplashScreen {
    splashView = [[UIView alloc] initWithFrame:self.view.frame];
    [splashView setBackgroundColor:[UIColor colorWithRed:15/255.0 green:17/255.0 blue:22/255.0 alpha:1.0]];
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

    [self setUIConstraint];
}

- (void) viewDidLoad {
    [super viewDidLoad];
    [self setSplashScreen];

    NSArray *versionCompatibility = [[UIDevice currentDevice].systemVersion componentsSeparatedByString:@"."];
    NSInteger iOSVersion = [[versionCompatibility objectAtIndex:0] intValue];

    if (iOSVersion >= 7) {
        CGFloat viewWidth = self.view.frame.size.width;
        CGFloat viewHeight = self.view.frame.size.height;
        [self.webView setFrame:CGRectMake(0, 20, viewWidth, viewHeight - 20)];
    }

    [self.webView setAlpha:0];
    [self.webView setBackgroundColor:[UIColor blackColor]];
    [self.webView setOpaque:NO];
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

/* Comment out the block below to over-ride */

/*
- (UIWebView*) newCordovaViewWithFrame:(CGRect)bounds
{
    return[super newCordovaViewWithFrame:bounds];
}
*/

#pragma mark UIWebDelegate implementation

- (void)webViewDidStartLoad:(UIWebView *)webView {
    [webView setBackgroundColor:[UIColor blackColor]];
    [webView setOpaque:NO];
    [UIView animateWithDuration:0.5f animations:^{
        [webView setAlpha:1];
    } completion:^(BOOL animated){
    }];
    
    return [super webViewDidStartLoad:webView];
}

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

@implementation CommunityCommandDelegate

/* To override the methods, uncomment the line in the init function(s)
   in CommunityViewController.m
 */

#pragma mark CDVCommandDelegate implementation

- (id)getCommandInstance:(NSString*)className
{
    return [super getCommandInstance:className];
}

/*
   NOTE: this will only inspect execute calls coming explicitly from native plugins,
   not the commandQueue (from JavaScript). To see execute calls from JavaScript, see
   CommunityCommandQueue below
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

@implementation CommunityCommandQueue

/* To override, uncomment the line in the init function(s)
   in CommunityViewController.m
 */
- (BOOL)execute:(CDVInvokedUrlCommand*)command
{
    return [super execute:command];
}

@end
