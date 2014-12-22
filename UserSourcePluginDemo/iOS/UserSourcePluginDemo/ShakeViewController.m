//
//  ShakeViewController.m
//
//  Created by Rishi Diwan on 29/10/14.
//  Copyright (c) 2014 Tis Macmini. All rights reserved.
//

#import "ShakeViewController.h"

@implementation ShakeViewController

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    shakeView = [[ShakeView alloc] init];
    [self.view addSubview:shakeView];
    // Do any additional setup after loading the view.
}

- (void) viewDidAppear:(BOOL)animated {
    [super viewDidAppear:animated];
    if (![shakeView isFirstResponder]) {
        [shakeView becomeFirstResponder];
    }
}

- (void) viewWillDisappear:(BOOL)animated {
    [super viewWillDisappear:animated];
    if ([shakeView isFirstResponder]) {
        [shakeView resignFirstResponder];
    }
}

- (BOOL) canBecomeFirstResponder {
    return YES;
}

- (BOOL) becomeFirstResponder {
    if (![shakeView isFirstResponder]) {
        [shakeView becomeFirstResponder];
    }
    
    return YES;
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender
{
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

@end
