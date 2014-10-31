//
//  ShakeView.m
//  UserSource
//
//  Created by Rishi Diwan on 28/10/14.
//
//

#import "ShakeView.h"

@implementation ShakeView

- (id) init {
    self = [super init];

    if (self) {
        sheet = [[UIActionSheet alloc] initWithTitle:nil
                                            delegate:self
                                   cancelButtonTitle:@"Cancel"
                              destructiveButtonTitle:nil
                                   otherButtonTitles:@"Post Visual Feedback", @"View Feedback", nil];
        annoSingleton = [AnnoSingleton sharedInstance];
    }

    return self;
}

- (void) motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event {
    if (annoSingleton.email == nil || [annoSingleton.email isEqualToString:@""]) {
        NSLog(@"Email address is not specified");
        return;
    }

    if (event.subtype == UIEventSubtypeMotionShake) {
        // Put in code here to handle shake
        [sheet showInView:self.superview];
    }

    if ([super respondsToSelector:@selector(motionEnded:withEvent:)])
        [super motionEnded:motion withEvent:event];
}

- (BOOL) canBecomeFirstResponder {
    return YES;
}

- (void) didPresentActionSheet:(UIActionSheet *)actionSheet {
    lastScreenshotImage = [annoSingleton.utils takeScreenshot];
}

- (void)actionSheet:(UIActionSheet *)actionSheet didDismissWithButtonIndex:(NSInteger)buttonIndex {
    if (buttonIndex == 0) {
        // Post Feedback
        lastScreenshotPath = [annoSingleton.utils saveImageToTemp:lastScreenshotImage];
        [annoSingleton showAnnoDraw:lastScreenshotPath levelValue:0 editModeValue:NO landscapeModeValue:NO];
    } else if (buttonIndex == 1) {
        // Show community
        [annoSingleton showCommunityPage];
    }
}

@end