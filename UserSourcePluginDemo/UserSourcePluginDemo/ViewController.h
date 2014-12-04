//
//  ViewController.h
//  UserSourcePluginDemo
//
//  Created by Rishi Diwan on 02/12/14.
//  Copyright (c) 2014 Increpreneur Inc. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ShakeViewController.h"

@interface ViewController : ShakeViewController<UICollectionViewDataSource, UICollectionViewDelegate>

- (IBAction)openTouchUpInside:(id)sender;
@property (weak, nonatomic) IBOutlet UIScrollView *scrollView;
@property (weak, nonatomic) IBOutlet UICollectionView *assetsCollectionView;
@property (weak, nonatomic) IBOutlet UICollectionViewFlowLayout *assetsFlowLayout;
@end
