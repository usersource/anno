//
//  OptionFeedbackViewController.h
//  UserSource
//
//  Created by Imran Ahmed on 08/04/14.
//

#import <Cordova/CDVViewController.h>
#import <Cordova/CDVCommandDelegateImpl.h>
#import <Cordova/CDVCommandQueue.h>

@interface OptionFeedbackViewController : CDVViewController

+ (int) getLevel;
+ (void) setLevel:(int)levelValue;


@end

@interface OptionFeedbackCommandDelegate : CDVCommandDelegateImpl
@end

@interface OptionFeedbackCommandQueue : CDVCommandQueue
@end
