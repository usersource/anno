//
//  ShakeView.h
//  UserSource
//
//  Created by Rishi Diwan on 28/10/14.
//
//

#import <UIKit/UIKit.h>
#import "AnnoSingleton.h"

@interface ShakeView : UIView <UIActionSheetDelegate> {
//    UIActionSheet *sheet;
    UIView *sheet;
    UIView *buttonView;
    NSString *lastScreenshotPath;
    UIImage *lastScreenshotImage;
    
    CGRect screenRect;
    CGRect belowScreenRect;
    CGRect buttonRect;
    
    AnnoSingleton *anno;
    bool presented;
    int shakeValue;
    NSDate *lastShakeTime;
}

- (void) postNewTapped;
- (void) viewFeedbackTapped;
- (void) styleSheet;
- (void) showShakeMenu;

@end

