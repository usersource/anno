//
//  AnnoSingleton.h
//  UserSource
//
//  Created by Rishi Diwan on 22/10/14.
//
//

#import <Foundation/Foundation.h>
#import <UserSourceStatic/annoCordovaPlugin.h>

@interface AnnoSingleton : NSObject {
    AnnoCordovaPlugin *annoPlugin;
    CommunityViewController *communityViewController;
    IntroViewController *introViewController;
    OptionFeedbackViewController *optionFeedbackViewController;
    NSString *email, *displayName, *userImageURL, *teamKey, *teamSecret;
    NSMutableArray *viewControllerList, *annoDrawViewControllerList;
    AnnoUtils *utils;
    BOOL isPlugin;
    Class infoViewControllerClass;
}

@property (strong, retain) CommunityViewController *communityViewController;
@property (strong, retain) AnnoCordovaPlugin *annoPlugin;
@property (strong, retain) AnnoUtils *utils;
@property (strong, retain) NSString *email, *displayName, *userImageURL, *teamKey, *teamSecret;
@property NSMutableArray *viewControllerList;
@property NSMutableArray *annoDrawViewControllerList;
@property BOOL isPlugin;
@property (assign) Class infoViewControllerClass;

+ (id) sharedInstance;

- (void) showCommunityPage;
- (void) showIntroPage;
- (void) showOptionFeedback;
- (void) exitActivity;

- (UIViewController*) getTopMostViewController;

- (void) showAnnoDraw:(NSString*)imageURI
           levelValue:(int)levelValue
        editModeValue:(BOOL)editModeValue
   landscapeModeValue:(BOOL)landscapeModeValue;

- (void) setupWithEmail:(NSString*)email
            displayName:(NSString*)displayName
           userImageURL:(NSString*)userImageURL
                teamKey:(NSString*)teamKey
             teamSecret:(NSString*)teamSecret;

@end