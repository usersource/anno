//
//  AnnoUtils.m
//  UserSource
//
//  Created by Imran Ahmed on 08/04/14.
//
//

#import "AnnoUtils.h"
#import "AnnoCordovaPlugin.h"

@implementation AnnoUtils

- (id) init {
    self = [super init];
    
    if (self) {
        self.ANNO_SOURCE_PLUGIN = @"plugin";
        self.ANNO_SOURCE_STANDALONE = @"standalone";
        self.debugEnabled = true;

        self.INTENT_EXTRA_IS_PRACTICE = @"is_practice";
        self.UNKNOWN_APP_NAME = @"Unknown";

        self.SCREENSHOT_TIME_FORMAT = @"yyyy-MM-dd-kk-mm-ss";
        self.PNG_SUFFIX = @".png";
        self.LEVEL = @"level";
        self.FAIL_CREATE_DIRECTORY = @"Create directory '%@' failed.";
        self.ERROR_TITLE = @"Error";

        NSString *documentDirectory = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
        self.dataLocation = [documentDirectory stringByAppendingPathComponent:@"UserSource"];
        self.screenshotDirName = @"screenshot";

        self.ANNO_PACKAGE_NAME = @"io.usersource.anno";

        self.IMAGE_ORIENTATION_PORTRAIT = @"portrait";
        self.IMAGE_ORIENTATION_LANDSCAPE = @"landscape";
        
        self.PROJECT_NAME = @"User Source";
    }
    
    return self;
}

- (NSString*) isLandscapeOrPortrait:(UIImage*)drawableImage {
    int width = drawableImage.size.width;
    int height  = drawableImage.size.height;
    NSString *orientation;
    
    if (width > height) {
        orientation = self.IMAGE_ORIENTATION_LANDSCAPE;
    } else {
        orientation = self.IMAGE_ORIENTATION_PORTRAIT;
    }
    
    return orientation;
}

- (UIImage*) rotateImage:(UIImage*)image rotatedByDegrees:(CGFloat)degrees {
    CGImageRef imgRef = image.CGImage;
    CGFloat angleInRadians = degrees * (M_PI / 180);

    CGRect imgRect = CGRectMake(0, 0, CGImageGetWidth(imgRef), CGImageGetHeight(imgRef));
    CGAffineTransform transform = CGAffineTransformMakeRotation(angleInRadians);

    CGRect rotatedRect = CGRectApplyAffineTransform(imgRect, transform);
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    CGContextRef bmContext = CGBitmapContextCreate(NULL, rotatedRect.size.width, rotatedRect.size.height, 8, 0, colorSpace,
                                                   (CGBitmapInfo)kCGImageAlphaPremultipliedFirst);

    CGContextSetAllowsAntialiasing(bmContext, YES);
    CGContextSetShouldAntialias(bmContext, YES);
    CGContextSetInterpolationQuality(bmContext, kCGInterpolationHigh);
    CGColorSpaceRelease(colorSpace);
    CGContextTranslateCTM(bmContext, +(rotatedRect.size.width/2), +(rotatedRect.size.height/2));
    CGContextRotateCTM(bmContext, angleInRadians);
    CGContextTranslateCTM(bmContext, -(rotatedRect.size.height/2), -(rotatedRect.size.width/2));
    CGContextDrawImage(bmContext, CGRectMake(0, 0, rotatedRect.size.height, rotatedRect.size.width), imgRef);
    
    CGImageRef rotatedImage = CGBitmapContextCreateImage(bmContext);
    CFRelease(bmContext);
    return [UIImage imageWithCGImage:rotatedImage];
}

- (NSString*) saveImageToTemp:(UIImage*)image {
    NSURL *tmpDirURL = [NSURL fileURLWithPath:NSTemporaryDirectory() isDirectory:YES];
    NSString *timeStamp = [NSString stringWithFormat:@"%d", (int)[[NSDate date] timeIntervalSince1970]];
    NSString *fileName = [[@"anno_" stringByAppendingString:timeStamp] stringByAppendingPathExtension:@"jpg"];
    NSString *fullPath = [[tmpDirURL path] stringByAppendingPathComponent:fileName];
    [[NSFileManager defaultManager] createFileAtPath:fullPath
                                            contents:UIImageJPEGRepresentation(image, 1.0)
                                          attributes:nil];
    return [[NSURL fileURLWithPath:fullPath] absoluteString];
}

- (void) mkdirs:(NSString *)path {
    BOOL dirCreated = [[NSFileManager defaultManager] createDirectoryAtPath:path
                                                withIntermediateDirectories:YES
                                                                 attributes:nil
                                                                      error:nil];
    
    if (!dirCreated) {
        NSLog(self.FAIL_CREATE_DIRECTORY, path);
    }
}

- (BOOL) isAnno:(NSString*)bundleID {
    return [self.ANNO_PACKAGE_NAME isEqualToString:bundleID];
}

- (NSString*) getAppName {
    return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"];
}

- (NSString*) getAppVersion {
    return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"];
}

- (NSString*) generateScreenshotName {
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    [dateFormatter setDateFormat:self.SCREENSHOT_TIME_FORMAT];
    NSString *formattedDateString = [dateFormatter stringFromDate:[NSDate date]];
    return [NSString stringWithFormat:@"%@%@%@", @"Screenshot_", formattedDateString, self.PNG_SUFFIX];
}

- (UIImage*) takeScreenshot {
    UIGraphicsBeginImageContextWithOptions(appDelegate.window.bounds.size, YES, 0.0);
    [appDelegate.window.layer renderInContext:UIGraphicsGetCurrentContext()];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    return image;
}

- (void) displayError:(NSString*)message {
    UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:annoUtils.ERROR_TITLE
                                                        message:message
                                                       delegate:self
                                              cancelButtonTitle:@"Ok"
                                              otherButtonTitles:nil];
    
    [alertView show];
}

- (void) triggerCreateAnno:(UIViewController*)viewController {
    int level = 0;

    if ([viewController isKindOfClass:[CommunityViewController class]]) {
        level = [CommunityViewController getLevel];
    } else if ([viewController isKindOfClass:[OptionFeedbackViewController class]]) {
        level = [OptionFeedbackViewController getLevel];
    } else if ([viewController isKindOfClass:[IntroViewController class]]) {
        level = [IntroViewController getLevel];
    } else if ([viewController isKindOfClass:[AnnoDrawViewController class]]) {
        level = [AnnoDrawViewController getLevel];
    }

    if (level >= 2) {
        if (self.debugEnabled) {
            NSLog(@"Already 2 levels, no recursive any more.");
        }
        return;
    }

    @try {
        NSString *screenshotPath = [screenshotGestureListener takeScreenshot];
        [screenshotGestureListener launchAnnoPlugin:viewController screenshotPath:screenshotPath];
    }
    @catch (NSException *exception) {
        if (annoUtils.debugEnabled) {
            NSLog(@"Exception in triggerCreateAnno: %@", exception);
        }
        [annoUtils displayError:screenshotGestureListener.TAKE_SCREENSHOT_FAIL_MESSAGE];
    }
}

@end
