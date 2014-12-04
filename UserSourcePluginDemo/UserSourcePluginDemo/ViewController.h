//
//  ViewController.h
//  UserSourcePluginDemo
//
//  Created by Rishi Diwan on 02/12/14.
//  Copyright (c) 2014 Increpreneur Inc. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ShakeViewController.h"
#import "InfoViewController.h"

@interface ViewController : ShakeViewController<UICollectionViewDataSource, UICollectionViewDelegate>

- (IBAction) openTouchUpInside:(id)sender;
- (IBAction) showInfoPage:(id)sender;

@property (strong, nonatomic) IBOutlet UIView *galleryView;
@property (strong, nonatomic) IBOutlet UIScrollView *scrollView;
@property (strong, nonatomic) IBOutlet UICollectionView *assetsCollectionView;
@property (strong, nonatomic) IBOutlet UICollectionViewFlowLayout *assetsFlowLayout;

@end
