//
//  AnnoDrawViewController.h
//  UserSource
//
//  Created by Imran Ahmed on 08/04/14.
//

#import <Cordova/CDVViewController.h>
#import <Cordova/CDVCommandDelegateImpl.h>
#import <Cordova/CDVCommandQueue.h>

@interface AnnoDrawViewController : CDVViewController

- (void) handleFromShareImage:(NSString *)imageURI
                   levelValue:(int)levelValue
              isPracticeValue:(BOOL)isPracticeValue
                editModeValue:(BOOL)editModeValue;
- (NSString*) getScreenshotPath;
- (int) getLevel;
- (BOOL) isEditMode;
- (void) setLevel:(int)levelValue;
- (void) setEditMode:(BOOL)editModeValue;

@end

@interface AnnoDrawCommandDelegate : CDVCommandDelegateImpl
@end

@interface AnnoDrawCommandQueue : CDVCommandQueue
@end
