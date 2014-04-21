//
//  UserSourceTests.m
//  UserSourceTests
//
//  Created by Imran Ahmed on 19/04/14.
//
//

#import <XCTest/XCTest.h>
#import "AppDelegate.h"
#import "AnnoCordovaPlugin.h"

@interface UserSourceTests : XCTestCase
@end

AppDelegate *appDelegate;
AnnoCordovaPlugin *annoCordovaPlugin;

@implementation UserSourceTests

- (void) setUp {
    [super setUp];
    appDelegate = [[UIApplication sharedApplication] delegate];
    annoCordovaPlugin = [[AnnoCordovaPlugin alloc] init];
}

- (void) tearDown {
    [super tearDown];
}

- (void) testCommunityViewControllerInstantion {
    XCTAssertNotNil(appDelegate.communityViewController, @"Community ViewController isn't created");
}

- (void) testAnnoUtilsInstantion {
    XCTAssertNotNil(appDelegate.annoUtils, @"AnnoUtils isn't created");
}

- (void) testRootViewController {
    UIViewController *rootViewController = appDelegate.window.rootViewController;
    CDVViewController *communityViewController = appDelegate.communityViewController;
    XCTAssertEqualObjects(rootViewController, communityViewController, @"Root ViewController isn't Community ViewController");
}

- (void) testAnnoCordovaPlugin {
    XCTAssertNotNil(annoCordovaPlugin, @"AnnoCordovaPlugin isn't present");
}

- (void) testShowCommunityPage {
    [annoCordovaPlugin showCommunityPage];
}

@end
