//
//  AnnoUtils.m
//  UserSource
//
//  Created by Imran Ahmed on 08/04/14.
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

        // give url of 'Document' directory of current app
        NSString *documentDirectory = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
        self.dataLocation = [documentDirectory stringByAppendingPathComponent:@"UserSource"];
        self.screenshotDirName = @"screenshot";

        self.ANNO_PACKAGE_NAME = @"io.usersource.anno";

        self.IMAGE_ORIENTATION_PORTRAIT = @"portrait";
        self.IMAGE_ORIENTATION_LANDSCAPE = @"landscape";

        self.PROJECT_NAME = @"UserSource";
    }

    return self;
}

/**
 Determine if the image orientation is landscape or portrait.
 @param drawableImage
        UIImage of image file
 @return orientation of image
 */
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

/**
 Rotate the image by specified degrees.
 @see http://rexstjohn.com/image-rotation/ for more information. We modified
 that function to make it work properly.
 @param image
        UIImage of image which is to be rotated
 @param degress
        value by which image to be rotated
 @return UIImage of rotated image
 */
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

/**
 Save image to 'tmp' directory of UserSource app.
 @param image
        UIImage of image which is to be saved in 'tmp' directory
 @return string url of file which is full location where image is saved
 */
- (NSString*) saveImageToTemp:(UIImage*)image {
    // give location to tmp directory of UserSource app in iOS device
    NSURL *tmpDirURL = [NSURL fileURLWithPath:NSTemporaryDirectory() isDirectory:YES];

    // getting timestamp of current time for image name, image name will be 'anno_<timestamp>.jpg'
    NSString *timeStamp = [NSString stringWithFormat:@"%d", (int)[[NSDate date] timeIntervalSince1970]];
    NSString *fileName = [[@"anno_" stringByAppendingString:timeStamp] stringByAppendingPathExtension:@"jpg"];
    NSString *fullPath = [[tmpDirURL path] stringByAppendingPathComponent:fileName];

    // creating jpg image without any compression in 'tmp' directory
    [[NSFileManager defaultManager] createFileAtPath:fullPath
                                            contents:UIImageJPEGRepresentation(image, 1.0)
                                          attributes:nil];

    return [[NSURL fileURLWithPath:fullPath] absoluteString];
}

/**
 Create a directory at specified path.
 This method creates any non-existent parent directories as part of creating the
 directory in path.
 @param path
        string identifying directory to create.
 */
- (void) mkdirs:(NSString *)path {
    // YES if the directory was created or the directory already exists,
    // or NO if an error occurred
    BOOL dirCreated = [[NSFileManager defaultManager] createDirectoryAtPath:path
                                                withIntermediateDirectories:YES
                                                                 attributes:nil
                                                                      error:nil];

    if (!dirCreated) {
        NSLog(self.FAIL_CREATE_DIRECTORY, path);
    }
}

/**
 Check if current app is standalone anno.
 @param bundleID
        bundle identifier of current app
 @return YES if current app is UserSource app
 */
- (BOOL) isAnno:(NSString*)bundleID {
    return [self.ANNO_PACKAGE_NAME isEqualToString:bundleID];
}

/**
 Get application name
 @return name of currect application
 */
- (NSString*) getAppName {
    return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"];
}

/**
 Get application version
 @return version of current application
 */
- (NSString*) getAppVersion {
    return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"];
}

/**
 Generate screenshot file name.
 @return filename of screenshot. Screenshot filename will be 'Screenshot_<yyyy-MM-dd-kk-mm-ss>.png'.
 */
- (NSString*) generateScreenshotName {
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    [dateFormatter setDateFormat:self.SCREENSHOT_TIME_FORMAT];
    NSString *formattedDateString = [dateFormatter stringFromDate:[NSDate date]];
    return [NSString stringWithFormat:@"%@%@%@", @"Screenshot_", formattedDateString, self.PNG_SUFFIX];
}

/**
 Take screenshot of current screen of iOS device.
 @see http://stackoverflow.com/a/2203293/1364558 for more information.
 @return UIImage of screenshot
 */
- (UIImage*) takeScreenshot {
    UIGraphicsBeginImageContextWithOptions(appDelegate.window.bounds.size, YES, 0.0);
    [appDelegate.window.layer renderInContext:UIGraphicsGetCurrentContext()];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    return image;
}

/**
 Display error message.
 @param message
        error message which is to be displayed
 */
- (void) displayError:(NSString*)message {
    UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:annoUtils.ERROR_TITLE
                                                        message:message
                                                       delegate:self
                                              cancelButtonTitle:@"Ok"
                                              otherButtonTitles:nil];

    [alertView show];
}

/**
 Trigger Create Anno, take screenshot and launch AnnoDrawViewController.
 @param viewController
        source viewcontroller
 */
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
