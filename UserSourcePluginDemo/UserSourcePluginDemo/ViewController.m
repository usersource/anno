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

#define EMAIL @"david.kennan@gmail.com"
#define NAME @"David Kennan"
#define IMAGEURL @"http://lh4.ggpht.com/0L3HSgl41440aC-U_N7hLaYSZjQtItLdiTKlCZJEThCckvwZKkNRkL9eMm55hHn5oN6l6xQf3bj-SXlqyjPhh_1iShO-qvZg"

@interface ViewController () {
    NSMutableArray *assetGroups;
    NSMutableArray *assetUrls;
    ALAssetsLibrary* library;
}

@end

@implementation ViewController

@synthesize assetsCollectionView, scrollView, assetsFlowLayout;

- (void)viewDidLoad
{
    [super viewDidLoad];
	// Do any additional setup after loading the view, typically from a nib.
    assetGroups = [[NSMutableArray alloc] init];
    assetUrls = [[NSMutableArray alloc] init];
    library = [[ALAssetsLibrary alloc] init];
    
    [assetsCollectionView registerNib:[UINib nibWithNibName:@"assetsCollectionCell" bundle:nil] forCellWithReuseIdentifier:@"assetGroup"];
    
    [assetsFlowLayout setItemSize:CGSizeMake(100, 100)];
    [assetsFlowLayout setMinimumInteritemSpacing:0];
    [assetsFlowLayout setMinimumLineSpacing:0];
    [assetsFlowLayout setHeaderReferenceSize:CGSizeMake(100, 24)];
    
    UIPanGestureRecognizer *gestureRecognizer = [[UIPanGestureRecognizer alloc]
                                                 initWithTarget:self action:@selector(handlePanGesture:)];
    [scrollView addGestureRecognizer:gestureRecognizer];
    
    AnnoSingleton *anno = [AnnoSingleton sharedInstance];
    [anno setupWithEmail:EMAIL
             displayName:NAME
            userImageURL:IMAGEURL
                 teamKey:@"io.usersource.demo"
              teamSecret:@"usersource"];
    
    [self enumerateAlbums];
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
    float hRatio = (bounds.origin.y/screen.size.height);
    float wFraction = wRatio - floor(wRatio);
    float hFraction = hRatio - floor(hRatio);
    
    if (velocity.x > 0 && wFraction < 0.9) {
        bounds.origin.x = screen.size.width * floor(wRatio);
    } else if (velocity.x < 0 && wFraction > 0.1) {
        bounds.origin.x = screen.size.width * ceil(wRatio);
    } else if (velocity.x < 0) {
        bounds.origin.x = screen.size.width * floor(wRatio);
    } else if (velocity.x > 0) {
        bounds.origin.x = screen.size.width * ceil(wRatio);
    }
    
    [UIView animateWithDuration:0.3 animations:^{
        scrollView.bounds = bounds;
    }];
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
        UIImageView *imgView = [[UIImageView alloc] init];
        [scrollView addSubview:imgView];
        [imgView setFrame:CGRectMake([UIScreen mainScreen].bounds.size.width*i, 0,
                                     [UIScreen mainScreen].bounds.size.width,
                                     [UIScreen mainScreen].bounds.size.height)];
        
        [imgView setContentMode:UIViewContentModeScaleAspectFit];
        [library assetForURL:url resultBlock:^(ALAsset *asset) {
            if (asset && imgView && [imgView isDescendantOfView:scrollView]) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    [imgView setImage:[UIImage imageWithCGImage:[[asset defaultRepresentation] fullScreenImage]]];
                });
            }
        } failureBlock:^(NSError *error) {
            
        }];
        i ++;
    }
    
    [scrollView setContentSize:CGSizeMake([UIScreen mainScreen].bounds.size.width*i, [UIScreen mainScreen].bounds.size.height)];
}

@end
