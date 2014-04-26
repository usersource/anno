//
//  IntroViewController.h
//  UserSource
//
//  Created by Imran Ahmed on 08/04/14.
//

#import <Cordova/CDVViewController.h>
#import <Cordova/CDVCommandDelegateImpl.h>
#import <Cordova/CDVCommandQueue.h>

@interface IntroViewController : CDVViewController

+ (int) getLevel;
+ (void) setLevel:(int)levelValue;


@end

@interface IntroCommandDelegate : CDVCommandDelegateImpl
@end

@interface IntroCommandQueue : CDVCommandQueue
@end
