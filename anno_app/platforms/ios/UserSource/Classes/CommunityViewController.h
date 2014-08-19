//
//  CommunityViewController.h
//  UserSource
//
//  Created by Imran Ahmed on 08/04/14.
//

#import <Cordova/CDVViewController.h>
#import <Cordova/CDVCommandDelegateImpl.h>
#import <Cordova/CDVCommandQueue.h>

@interface CommunityViewController : CDVViewController

- (int) getLevel;
- (void) setLevel:(int)levelValue;

@end

@interface CommunityCommandDelegate : CDVCommandDelegateImpl
@end

@interface CommunityCommandQueue : CDVCommandQueue
@end
