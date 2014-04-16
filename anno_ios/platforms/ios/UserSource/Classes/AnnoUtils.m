#import "AnnoUtils.h"

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

@end
