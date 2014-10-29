//
//  ShakeView.h
//  UserSource
//
//  Created by Rishi Diwan on 28/10/14.
//
//

#import <UIKit/UIKit.h>

@interface ShakeView : UIView <UIActionSheetDelegate> {
    UIActionSheet *sheet;
    NSString *lastScreenshotPath;
}

@end

