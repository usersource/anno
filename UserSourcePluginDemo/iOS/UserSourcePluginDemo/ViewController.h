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
#import <FacebookSDK/FacebookSDK.h>

@interface ViewController : ShakeViewController <UICollectionViewDataSource,
                                                 UICollectionViewDelegate,
                                                 FBLoginViewDelegate,
                                                 UIAlertViewDelegate,
                                                 UITableViewDelegate,
                                                 UITableViewDataSource> {
    UINavigationBar *navigationBar;
    UINavigationItem *navItem;
    UIBarButtonItem *cancelButton;
    UITableView *selectTeamTableView;
}

- (IBAction) openTouchUpInside:(id)sender;
- (IBAction) showInfoPage:(id)sender;

@property (strong, nonatomic) UIView *selectTeamView;
@property (strong, nonatomic) IBOutlet UIView *loginView;
@property (strong, nonatomic) IBOutlet UIScrollView *scrollView;
@property (strong, nonatomic) IBOutlet UICollectionView *assetsCollectionView;
@property (strong, nonatomic) IBOutlet UICollectionViewFlowLayout *assetsFlowLayout;
@property (weak, nonatomic) IBOutlet UIView *bottomView;

@end
