#import "AnnoUtils.h"
#import <AssetsLibrary/AssetsLibrary.h>

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
        self.FAIL_CREATE_DIRECTORY = @"Create directory %s failed.";
        self.ERROR_TITLE = @"Error";

        self.dataLocation = [NSString stringWithFormat:@"%@/Anno", [[NSBundle mainBundle] bundlePath]];
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

- (UIImage*) rotateImage:(UIImage*)drawableImage degree:(int)degree {
    return [[UIImage alloc] initWithCGImage:drawableImage.CGImage
                                      scale:(degree / 90.0)
                                orientation:UIImageOrientationLeft];
}

- (void) saveImage:(UIImage*)image inAlbum:(NSString*)album completionBlock:(completionFunction)completionBlock {
    ALAssetsLibrary *assetsLibrary = [[ALAssetsLibrary alloc] init];
    
    [assetsLibrary writeImageToSavedPhotosAlbum:image.CGImage
                                    orientation:(ALAssetOrientation)image.imageOrientation
                                completionBlock:^(NSURL* assetURL, NSError* error) {
                                    if (error != nil) {
                                        completionBlock(error);
                                        return;
                                    }
//                                    __block BOOL albumWasFound = NO;
//                                    
//                                    //search all photo albums in the library
//                                    [assetsLibrary enumerateGroupsWithTypes:ALAssetsGroupAlbum
//                                                                 usingBlock:^(ALAssetsGroup *group, BOOL *stop) {
//                                                                     
//                                                                     //compare the names of the albums
//                                                                     if ([album compare: [group valueForProperty:ALAssetsGroupPropertyName]]==NSOrderedSame) {
//                                                                         
//                                                                         //target album is found
//                                                                         albumWasFound = YES;
//                                                                         
//                                                                         //get a hold of the photo's asset instance
//                                                                         [assetsLibrary assetForURL: assetURL
//                                                                                        resultBlock:^(ALAsset *asset) {
//                                                                                            
//                                                                                            //add photo to the target album
//                                                                                            [group addAsset: asset];
//                                                                                            
//                                                                                            //run the completion block
//                                                                                            completionBlock(nil);
//                                                                                            
//                                                                                        } failureBlock: completionBlock];
//                                                                         
//                                                                         //album was found, bail out of the method
//                                                                         return;
//                                                                     }
//                                                                     
//                                                                     if (group==nil && albumWasFound==NO) {
//                                                                         //photo albums are over, target album does not exist, thus create it
//                                                                         
//                                                                         __weak ALAssetsLibrary* weakSelf = assetsLibrary;
//                                                                         
//                                                                         //create new assets album
//                                                                         [assetsLibrary addAssetsGroupAlbumWithName:album
//                                                                                                        resultBlock:^(ALAssetsGroup *group) {
//                                                                                                            
//                                                                                                            //get the photo's instance
//                                                                                                            [weakSelf assetForURL: assetURL
//                                                                                                                      resultBlock:^(ALAsset *asset) {
//                                                                                                                          
//                                                                                                                          //add photo to the newly created album
//                                                                                                                          [group addAsset: asset];
//                                                                                                                          
//                                                                                                                          //call the completion block
//                                                                                                                          completionBlock(nil);
//                                                                                                                          
//                                                                                                                      } failureBlock: completionBlock];
//                                                                                                            
//                                                                                                        } failureBlock: completionBlock];
//                                                                         
//                                                                         //should be the last iteration anyway, but just in case
//                                                                         return;
//                                                                     }
//                                                                     
//                                                                 } failureBlock: completionBlock];
//                                }
     ];
}

@end
