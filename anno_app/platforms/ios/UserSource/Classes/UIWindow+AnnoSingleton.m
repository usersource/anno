#import "UIWindow+AnnoSingleton.h"
#import "AnnoSingleton.h"
#import "ShakeView.h"

@implementation UIWindow (AnnoSingleton)

- (void) UserSourceMotionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event {
    ShakeView *shakeView = [[ShakeView alloc] init];
    if (event.subtype == UIEventSubtypeMotionShake) {
        [shakeView showShakeMenu];
    }

    if ([super respondsToSelector:@selector(motionEnded:withEvent:)]) {
        [super motionEnded:motion withEvent:event];
    }
}

- (BOOL) canBecomeFirstResponder {
    return YES;
}

@end