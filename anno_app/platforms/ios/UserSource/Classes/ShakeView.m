//
//  ShakeView.m
//  UserSource
//
//  Created by Rishi Diwan on 28/10/14.
//
//

#import "ShakeView.h"

@implementation ShakeView {
    UIView *unreadView;
}

- (id) init {
    self = [super init];

    if (self) {
//        sheet = [[UIActionSheet alloc] initWithTitle:@"Shake to Feedback!!"
//                                            delegate:self
//                                   cancelButtonTitle:nil
//                              destructiveButtonTitle:nil
//                                   otherButtonTitles:nil];
        
        anno = [AnnoSingleton sharedInstance];
        [self redoRects];
        sheet = [[UIView alloc] initWithFrame:screenRect];
        [sheet setUserInteractionEnabled:YES];
        [self styleSheet];
        shakeValue = 0;
        lastShakeTime = nil;
    }

    return self;
}

- (void) redoRects {
    int height = 140;
    CGRect screen = [UIScreen mainScreen].applicationFrame;
//    NSLog (@"Screen %@", NSStringFromCGRect(screen));
    belowScreenRect = CGRectMake(0, screen.size.height+1, screen.size.width, screen.size.height);
    screenRect = CGRectMake(screen.origin.x, screen.origin.y, screen.size.width, screen.size.height);
    buttonRect = CGRectMake(0, screen.size.height - height, screen.size.width, height);
}


- (void) styleSheet {
    
    [sheet setBackgroundColor:[UIColor colorWithWhite:0.1f alpha:0.5f]];
    
    buttonView = [[UIView alloc] initWithFrame:belowScreenRect];
    [sheet addSubview:buttonView];
    
    int buttonWidth = 300;
    int buttonX = (screenRect.size.width - buttonWidth)/2;
    int buttonHeight = 40;
    int buttonMargin = 4;
    
    UIButton *postFeedbackButton = [self makeNewButtonWithTitle:@"New Feedback" selector:@selector(postNewTapped)];
    [[postFeedbackButton titleLabel] setFont:[UIFont boldSystemFontOfSize:20]];
    [postFeedbackButton setFrame:CGRectMake(buttonX, 0, buttonWidth, buttonHeight)];
    
    [buttonView addSubview:postFeedbackButton];
    
    UIButton *viewFeedButton = [self makeNewButtonWithTitle:@"View Feedback" selector:@selector(viewFeedbackTapped)];
    [viewFeedButton setFrame:CGRectMake(buttonX, (buttonHeight + buttonMargin), buttonWidth, buttonHeight)];
    [buttonView addSubview:viewFeedButton];
    unreadView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 12, 12)];
    [unreadView setCenter:CGPointMake(16, buttonHeight/2)];
    [unreadView setBackgroundColor:[UIColor clearColor]];
    unreadView.layer.cornerRadius = 6;
    [viewFeedButton addSubview:unreadView];
    
    UIButton *cancelButton = [self makeNewButtonWithTitle:@"Cancel" selector:@selector(cancelTapped)];
    [cancelButton setFrame:CGRectMake(buttonX, (buttonHeight + buttonMargin)*2, buttonWidth, buttonHeight)];
    [buttonView addSubview:cancelButton];
    
}

- (UIButton*) makeNewButtonWithTitle:(NSString*)title selector:(SEL)selector {
    UIColor *highlightedColor = [UIColor colorWithRed:0/255.0f green:177/255.0f blue:148/255.0f alpha:1.0f];
    UIColor *buttonBackgroundColor = [UIColor colorWithWhite:0.3f alpha:1.0f];
    
    UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
    [button addTarget:self action:selector forControlEvents:UIControlEventTouchUpInside];
    button.adjustsImageWhenHighlighted = YES;
    [button setTitle:title forState:UIControlStateNormal];
    [button setTitleColor:[UIColor colorWithRed:255/255.0f green:255/255.0f blue:255/255.0f alpha:1.0f] forState:UIControlStateNormal];
    [button setTitleColor:highlightedColor forState:UIControlStateHighlighted];
    button.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    [button setBackgroundColor:buttonBackgroundColor];
    button.layer.cornerRadius = 8;
    
    return button;
}

- (void) postNewTapped {
    lastScreenshotPath = [anno.utils saveImageToTemp:lastScreenshotImage];
    [anno showAnnoDraw:lastScreenshotPath levelValue:0 editModeValue:NO landscapeModeValue:NO];
    [self removeOptionsSheet];
}

- (void) viewFeedbackTapped {
    [anno showCommunityPage];
    [self removeOptionsSheet];
}

- (void) cancelTapped {
    [self removeOptionsSheet];
}

- (void) removeOptionsSheet {
    presented = false;
    [UIView animateWithDuration:0.3f animations:^{
        [buttonView setFrame:belowScreenRect];
    } completion:^(BOOL animated) {
        [sheet removeFromSuperview];
    }];
}

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
    if ( event.subtype == UIEventSubtypeMotionShake )
    {
        if (!anno.allowShake) return;
        if (presented) return;

        if (lastShakeTime != nil) {
            NSTimeInterval timeDiff = [lastShakeTime timeIntervalSinceNow];
            NSLog(@"time diff in shakes: %f", timeDiff);
            if (timeDiff < -10) {
                shakeValue = 0;
                lastShakeTime = nil;
                return;
            }
        }

        lastShakeTime = [NSDate date];
        shakeValue += 1;
        if (shakeValue != (anno.shakeValue + 1)) return;

        // Put in code here to handle shake
//        [sheet showInView:self.superview];
//        [self.superview addSubview:sheet];
        [self redoRects];
        [sheet setFrame:screenRect];
        lastScreenshotImage = [anno.utils takeScreenshot];
        UIViewController* top = [anno getTopMostViewController];
        anno.viewControllerString = NSStringFromClass([[anno topMostViewController] class]);
        [top.view addSubview:sheet];
        [UIView animateWithDuration:0.3f animations:^{
            [buttonView setFrame:buttonRect];
        }];
//        int unreadCount = [[AnnoSingleton sharedInstance] unreadCount];
//        NSLog(@"Unread Count %d", unreadCount);
//        if (unreadCount > 0) {
//            [unreadView setBackgroundColor:[UIColor orangeColor]];
//        }
        
        presented = true;
        lastShakeTime = nil;
        shakeValue = 0;
    }

    if ([super respondsToSelector:@selector(motionEnded:withEvent:)])
        [super motionEnded:motion withEvent:event];
}

- (BOOL) canBecomeFirstResponder {
    return YES;
}
@end