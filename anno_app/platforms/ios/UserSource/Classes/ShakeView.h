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
    UIActionSheet *sheet;
    NSString *lastScreenshotPath;
    UIImage *lastScreenshotImage;
    AnnoSingleton *annoSingleton;
}

@end

