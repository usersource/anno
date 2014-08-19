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

    NSArray *versionCompatibility = [[UIDevice currentDevice].systemVersion componentsSeparatedByString:@"."];
    NSInteger iOSVersion = [[versionCompatibility objectAtIndex:0] intValue];

    if (iOSVersion == 7) {
        CGFloat viewWidth = self.view.frame.size.width;
        CGFloat viewHeight = self.view.frame.size.height;
        [self.webView setFrame:CGRectMake(0, 20, viewWidth, viewHeight - 20)];
    }
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    // Do any additional setup after loading the view from its nib.
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

- (void)webViewDidFinishLoad:(UIWebView*)theWebView
{
    // Black base color for background matches the native apps
    theWebView.backgroundColor = [UIColor blackColor];

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
- (BOOL)execute:(CDVInvokedUrlCommand*)command
{
    return [super execute:command];
}

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
