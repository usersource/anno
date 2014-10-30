//
//  ShakeView.m
//  UserSource
//
//  Created by Rishi Diwan on 28/10/14.
//
//

#import "ShakeView.h"
#import "AnnoSingleton.h"
#import "AnnoUtils.h"

@implementation ShakeView

- (id)init {
    self = [super init];
    
    if (self) {
        sheet = [[UIActionSheet alloc] initWithTitle:nil
                                            delegate:self
                                   cancelButtonTitle:@"Cancel"
                              destructiveButtonTitle:nil
                                   otherButtonTitles:@"Post Visual Feedback", @"View Feedback", nil];
    }
    
    return self;
}

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
    if ( event.subtype == UIEventSubtypeMotionShake )
    {
        // Put in code here to handle shake
        [sheet showInView:self.superview];
    }
    
    if ( [super respondsToSelector:@selector(motionEnded:withEvent:)] )
        [super motionEnded:motion withEvent:event];
}

- (BOOL)canBecomeFirstResponder
{ return YES; }

- (void)didPresentActionSheet:(UIActionSheet *)actionSheet {
    AnnoSingleton* anno = [AnnoSingleton sharedInstance];
    lastScreenshotImage = [anno.utils takeScreenshot];
}

- (void)actionSheet:(UIActionSheet *)actionSheet didDismissWithButtonIndex:(NSInteger)buttonIndex
{
    NSLog(@"Button %d", buttonIndex);
    AnnoSingleton* anno = [AnnoSingleton sharedInstance];
    if (buttonIndex == 0) {
        // Post Feedback
        lastScreenshotPath = [anno.utils saveImageToTemp:lastScreenshotImage];
        [anno showAnnoDraw:lastScreenshotPath levelValue:0 editModeValue:NO landscapeModeValue:NO];
    } else if (buttonIndex == 1) {
        // Show community
        [anno showCommunityPage];
    }
}

@end