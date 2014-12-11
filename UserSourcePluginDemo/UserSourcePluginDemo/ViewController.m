//
//  ViewController.m
//  UserSourcePluginDemo
//
//  Created by Rishi Diwan on 02/12/14.
//  Copyright (c) 2014 Increpreneur Inc. All rights reserved.
//

#import "ViewController.h"
#import "assetsCollectionViewCell.h"
#import <AssetsLibrary/ALAssetsLibrary.h>
#import <AssetsLibrary/ALAssetsGroup.h>
#import <AssetsLibrary/ALAsset.h>
#import <AssetsLibrary/ALAssetRepresentation.h>

#define LOOKAHEAD 3

@interface ViewController () {
    NSMutableArray *assetGroups;
    NSMutableArray *assetUrls;
    ALAssetsLibrary* library;
    BOOL userInfoFetch;
}

@end

@implementation ViewController

@synthesize assetsCollectionView, scrollView, assetsFlowLayout, bottomView;

- (void) viewDidLoad {
    [super viewDidLoad];
    
    self.loginView = [[UIView alloc] initWithFrame:[UIScreen mainScreen].bounds];
    [self.view addSubview:self.loginView];
    self.loginView.hidden = YES;
    
    [bottomView setBackgroundColor:[[UIColor blackColor] colorWithAlphaComponent:0.6]];

    UILabel *appName = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, 150, 20)];
    appName.text = @"UserSource Demo";
    appName.frame = CGRectOffset(appName.frame,
                                 (self.loginView.center.x - (appName.frame.size.width / 2)),
                                 ((self.loginView.center.y * 0.5) - (appName.frame.size.height / 2)));
    [self.loginView addSubview:appName];

    NSArray *permissions = @[@"email"];
    FBLoginView *fbLoginView = [[FBLoginView alloc] initWithReadPermissions:permissions];
    fbLoginView.delegate = self;
    fbLoginView.frame = CGRectOffset(fbLoginView.frame,
                                     (self.loginView.center.x - (fbLoginView.frame.size.width / 2)),
                                     ((self.loginView.center.y * 1.5) - (fbLoginView.frame.size.height / 2)));
    [self.loginView addSubview:fbLoginView];
}

- (void) loginViewShowingLoggedInUser:(FBLoginView *)loginView {
    self.loginView.hidden = YES;

    assetGroups = [[NSMutableArray alloc] init];
    assetUrls = [[NSMutableArray alloc] init];
    library = [[ALAssetsLibrary alloc] init];

    [assetsCollectionView registerNib:[UINib nibWithNibName:@"assetsCollectionCell" bundle:nil] forCellWithReuseIdentifier:@"assetGroup"];

    [assetsFlowLayout setItemSize:CGSizeMake(100, 100)];
    [assetsFlowLayout setMinimumInteritemSpacing:0];
    [assetsFlowLayout setMinimumLineSpacing:10];
    [assetsFlowLayout setHeaderReferenceSize:CGSizeMake(100, 24)];

    UIPanGestureRecognizer *gestureRecognizer = [[UIPanGestureRecognizer alloc]
                                                 initWithTarget:self action:@selector(handlePanGesture:)];
    [scrollView addGestureRecognizer:gestureRecognizer];
    
    UITapGestureRecognizer *tapGesture = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleTapGesture:)];
    [scrollView addGestureRecognizer:tapGesture];

    [self enumerateAlbums];
}

- (void) loginViewFetchedUserInfo:(FBLoginView *)loginView user:(id<FBGraphUser>)user {
    if (!userInfoFetch) {
        userInfoFetch = YES;
        [FBRequestConnection startWithGraphPath:@"me"
                                     parameters:@{@"fields": @"picture.type(normal)"}
                                     HTTPMethod:@"GET"
                              completionHandler:^(FBRequestConnection *connection, id result, NSError *error) {
                                  if (!error) {
                                      NSString *pictureURL = [[[result objectForKey:@"picture"] objectForKey:@"data"] objectForKey:@"url"];
                                      AnnoSingleton *anno = [AnnoSingleton sharedInstance];
                                      [anno setupWithEmail:[user objectForKey:@"email"]
                                               displayName:[user objectForKey:@"name"]
                                              userImageURL:pictureURL
                                                   teamKey:@"io.usersource.demo"
                                                teamSecret:@"usersource"];
                                      [anno notificationsForTarget:self performSelector:@selector(notificationsCount:)];
                                      [anno setInfoViewControllerClass:[InfoViewController class]];
                                  }
                                  else{
                                      NSLog(@"%@", [error localizedDescription]);
                                  }
                              }];
    }
}

- (void) loginViewShowingLoggedOutUser:(FBLoginView *)loginView {
    self.loginView.hidden = NO;
    AnnoSingleton *anno = [AnnoSingleton sharedInstance];
    [anno setupAnonymousUserWithteamKey:@"com.koobe.kaklic" teamSecret:@"kaklic"];
}

- (void) loginView:(FBLoginView *)loginView handleError:(NSError *)error {
    NSString *alertMessage, *alertTitle;

    if ([FBErrorUtility shouldNotifyUserForError:error]) {
        alertTitle = @"Facebook error";
        alertMessage = [FBErrorUtility userMessageForError:error];
    } else if ([FBErrorUtility errorCategoryForError:error] == FBErrorCategoryAuthenticationReopenSession) {
        alertTitle = @"Session Error";
        alertMessage = @"Your current session is no longer valid. Please log in again.";
    } else if ([FBErrorUtility errorCategoryForError:error] == FBErrorCategoryUserCancelled) {
        NSLog(@"user cancelled login");
    } else {
        alertTitle  = @"Something went wrong";
        alertMessage = @"Please try again later.";
        NSLog(@"Unexpected error:%@", error);
    }

    if (alertMessage) {
        [[[UIAlertView alloc] initWithTitle:alertTitle
                                    message:alertMessage
                                   delegate:nil
                          cancelButtonTitle:@"OK"
                          otherButtonTitles:nil] show];
    }
}

-(void) handleTapGesture:(UITapGestureRecognizer*)tap {
    if (tap.state == UIGestureRecognizerStateEnded) {
        [bottomView setHidden:!bottomView.hidden];
    }
}

-(void) handlePanGesture:(UIPanGestureRecognizer*)pan {
    CGPoint translation = [pan translationInView:scrollView];
    CGRect bounds = scrollView.bounds;
    
    // Translate the view's bounds, but do not permit values that would violate contentSize
    CGFloat newBoundsOriginX = bounds.origin.x - translation.x;
    CGFloat minBoundsOriginX = 0.0;
    CGFloat maxBoundsOriginX = scrollView.contentSize.width - bounds.size.width;
    bounds.origin.x = fmax(minBoundsOriginX, fmin(newBoundsOriginX, maxBoundsOriginX));
    
    CGFloat newBoundsOriginY = bounds.origin.y - translation.y;
    CGFloat minBoundsOriginY = 0.0;
    CGFloat maxBoundsOriginY = scrollView.contentSize.height - bounds.size.height;
    bounds.origin.y = fmax(minBoundsOriginY, fmin(newBoundsOriginY, maxBoundsOriginY));
    
    scrollView.bounds = bounds;
    [pan setTranslation:CGPointZero inView:scrollView];
    
    if (pan.state == UIGestureRecognizerStateEnded) {
        [self snapToScreenDirection:[pan velocityInView:scrollView]];
    }
}

-(void) snapToScreenDirection:(CGPoint)velocity {
    CGRect bounds = scrollView.bounds;
    CGRect screen = [UIScreen mainScreen].bounds;
    float wRatio = (bounds.origin.x/screen.size.width);
//    float hRatio = (bounds.origin.y/screen.size.height);
    float wFraction = wRatio - floor(wRatio);
//    float hFraction = hRatio - floor(hRatio);
    
    if (velocity.x > 0 && wFraction < 0.9) {
        bounds.origin.x = screen.size.width * floor(wRatio);
    } else if (velocity.x < 0 && wFraction > 0.1) {
        bounds.origin.x = screen.size.width * ceil(wRatio);
    } else if (velocity.x < 0) {
        bounds.origin.x = screen.size.width * floor(wRatio);
    } else if (velocity.x > 0) {
        bounds.origin.x = screen.size.width * ceil(wRatio);
    }
    
    [UIView animateWithDuration:0.1 delay:0 options:UIViewAnimationOptionCurveEaseOut animations:^{
        scrollView.bounds = bounds;
    } completion:nil];
    
    float target = (float)ceil(wRatio);
    if (0 <= (target - LOOKAHEAD + 1) &&  (target - LOOKAHEAD + 1) < [assetUrls count]) {
        NSURL* url = [assetUrls objectAtIndex:(target - LOOKAHEAD + 1)];
        [self insertImageAtPosition:target - LOOKAHEAD + 1 url:url];
    }
    if (target + LOOKAHEAD < [assetUrls count]) {
        NSURL* url = [assetUrls objectAtIndex:target + LOOKAHEAD];
        [self insertImageAtPosition:target + LOOKAHEAD url:url];
    }
    [self removeImageAtPosition:target - LOOKAHEAD];
    [self removeImageAtPosition:target + LOOKAHEAD + 1];
}

- (void) enumerateAlbums {
    [assetsCollectionView setHidden:NO];
    [assetGroups removeAllObjects];
    [library enumerateGroupsWithTypes:ALAssetsGroupAll usingBlock:^(ALAssetsGroup *group, BOOL *stop) {
        if (group != nil) {
            [assetGroups addObject:group];
        } else {
            dispatch_async(dispatch_get_main_queue(), ^{
                [assetsCollectionView reloadData];
            });
        }
    } failureBlock:^(NSError *error) {
        NSLog(@"Failure enumerating groups %@", error);
    }];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction) openTouchUpInside:(id)sender {
    [self enumerateAlbums];
}

- (IBAction) showInfoPage:(id)sender {
    InfoViewController *infoViewController = [[InfoViewController alloc] init];
    [self presentViewController:infoViewController animated:YES completion:nil];
}

#pragma mark CollectionViewDelegate
#pragma mark CollectionViewDatasource
-(UICollectionViewCell*) collectionView:(UICollectionView *)collectionView cellForItemAtIndexPath:(NSIndexPath *)indexPath {
    if (indexPath.row > [assetGroups count]) {
        return nil;
    }
    assetsCollectionViewCell *cell = [collectionView dequeueReusableCellWithReuseIdentifier:@"assetGroup" forIndexPath:indexPath];
    ALAssetsGroup *group = (ALAssetsGroup*)[assetGroups objectAtIndex:indexPath.row];
    
    [cell.assetImageView setImage:[UIImage imageWithCGImage:group.posterImage]];
    [cell.assetLabel setText:(NSString*)[group valueForProperty:ALAssetsGroupPropertyName]];
    [cell.assetLabel setAdjustsFontSizeToFitWidth:YES];
    [cell setBackgroundColor:[UIColor redColor]];
    
    UITapGestureRecognizer *tap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(tappedGroupCell:)];
    [cell addGestureRecognizer:tap];
    
    [cell setTag:indexPath.row];
    
    return cell;
}

-(NSInteger) collectionView:(UICollectionView *)collectionView numberOfItemsInSection:(NSInteger)section {
    return [assetGroups count];
}

-(void) tappedGroupCell:(id)sender {
    UITapGestureRecognizer* tap = (UITapGestureRecognizer*)sender;
    
    ALAssetsGroup *group = [assetGroups objectAtIndex:tap.view.tag];
    [assetUrls removeAllObjects];
    [group enumerateAssetsUsingBlock:^(ALAsset *result, NSUInteger index, BOOL *stop) {
        if (result) {
            [assetUrls addObject:[result valueForProperty:ALAssetPropertyAssetURL]];
        } else {
            [self reloadAllImages];
        }
    }];
    [assetsCollectionView setHidden:YES];
}

-(void) reloadAllImages {
    for (UIView* v in [scrollView subviews]) {
        [v removeFromSuperview];
    }
    
    int i = 0;
    for (NSURL* url in assetUrls) {
        if (i > LOOKAHEAD) break; // First 5 only
        [self insertImageAtPosition:i url:url];
        i ++;
    }
}

-(void) removeImageAtPosition:(int)position {
    if ([scrollView viewWithTag:100 + position] == nil)
        return;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        [[scrollView viewWithTag:100 + position] removeFromSuperview];
    });
}

-(void) insertImageAtPosition:(int)position url:(NSURL*)url {
    if ([scrollView viewWithTag:100 + position] != nil)
        return;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        UIImageView *imgView = [[UIImageView alloc] init];
        [scrollView addSubview:imgView];
        [imgView setFrame:[self frameForImageAtPosition:position]];
        [imgView setTag:100 + position];
        [imgView setContentMode:UIViewContentModeScaleAspectFit];
        [library assetForURL:url resultBlock:^(ALAsset *asset) {
            if (asset && imgView && [imgView isDescendantOfView:scrollView]) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    [imgView setImage:[UIImage imageWithCGImage:[[asset defaultRepresentation] fullScreenImage]]];
                });
            }
        } failureBlock:^(NSError *error) {
            
        }];
        
        int maxTag = 0;
        for (UIView *v in [scrollView subviews]) {
            maxTag = (int)MAX(v.tag - 100, maxTag);
        }
        [scrollView setContentSize:CGSizeMake([UIScreen mainScreen].bounds.size.width*(maxTag+1),
                                              [UIScreen mainScreen].bounds.size.height)];
    });
}

-(CGRect) frameForImageAtPosition:(int)position {
    return CGRectMake([UIScreen mainScreen].bounds.size.width*position, 0,
                      [UIScreen mainScreen].bounds.size.width,
                      [UIScreen mainScreen].bounds.size.height);
}

-(void) notificationsCount:(NSNumber*)count {
    if ([count integerValue] > 0) {
        [[[UIAlertView alloc] initWithTitle:@"Your Feedback"
                                    message:[NSString stringWithFormat:@"New Activity on %@ item%s", count, [count integerValue]>1?"s":""]
                                   delegate:self
                          cancelButtonTitle:@"Later"
                          otherButtonTitles:@"Show Me", nil] show];
    }
}

-(void) alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex {
    if (buttonIndex == 1) {
        [[AnnoSingleton sharedInstance] showCommunityPage];
    }
}

@end
