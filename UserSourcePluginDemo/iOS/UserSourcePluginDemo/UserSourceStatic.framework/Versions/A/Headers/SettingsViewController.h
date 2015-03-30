//
//  SettingsViewController.h
//  UserSource
//
//  Created by Imran Ahmed on 30/03/15.
//

#import <Cordova/CDVViewController.h>
#import <Cordova/CDVCommandDelegateImpl.h>
#import <Cordova/CDVCommandQueue.h>

@interface SettingsViewController : CDVViewController

- (int) getLevel;
- (void) setLevel:(int)levelValue;


@end

@interface SettingsCommandDelegate : CDVCommandDelegateImpl
@end

@interface SettingsCommandQueue : CDVCommandQueue
@end
