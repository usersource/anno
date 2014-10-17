//
//  UserSourceTests.m
//  UserSourceTests
//
//  Created by Imran Ahmed on 19/04/14.
//
//

#import <XCTest/XCTest.h>
#import "UserSourceAppDelegate.h"
#import "AnnoCordovaPlugin.h"

@interface UserSourceTests : XCTestCase
@end

@implementation UserSourceTests

UserSourceAppDelegate *appDelegate;

// XCTest works only for iOS 7 or later
- (void) setUp {
    [super setUp];
    appDelegate = [[UIApplication sharedApplication] delegate];
}

- (void) tearDown {
    [super tearDown];
}

/**
 Testing whether community viewcontroller is created or not
 */
- (void) testCommunityViewControllerInstantion {
    XCTAssertNotNil(appDelegate.communityViewController, @"Community ViewController isn't created");
}

/**
 Testing whether rootViewController is community viewcontroller or not
 */
- (void) testRootViewController {
    UIViewController *rootViewController = appDelegate.window.rootViewController;
    CDVViewController *communityViewController = appDelegate.communityViewController;
    XCTAssertEqualObjects(rootViewController, communityViewController, @"Root ViewController isn't Community ViewController");
}

@end
