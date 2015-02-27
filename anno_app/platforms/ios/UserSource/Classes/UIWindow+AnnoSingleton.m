#import "UIWindow+AnnoSingleton.h"
#import "AnnoSingleton.h"
#import "ShakeView.h"

@implementation UIWindow (AnnoSingleton)

- (void) UserSourceMotionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event {
    ShakeView *shakeView = [[ShakeView alloc] init];
    [shakeView motionEnded:motion withEvent:event];
}

@end
