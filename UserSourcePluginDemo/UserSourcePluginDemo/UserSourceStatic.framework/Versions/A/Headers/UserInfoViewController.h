//
//  UserInfoViewController.h
//  UserSource
//
//  Created by Imran on 28/10/14.
//
//

#import <UIKit/UIKit.h>

@interface UserInfoViewController : UIViewController <UITextFieldDelegate> {
    UINavigationBar *navigationBar;
    UIBarButtonItem *nextButton, *cancelButton;
    UILabel *infoLabel;
    UITextField *emailAddressTextField, *displayNameTextField, *imageURLTextField;
}

@property (strong, nonatomic) UINavigationBar *navigationBar;
@property (strong, nonatomic) UIBarButtonItem *nextButton;
@property (strong, nonatomic) UIBarButtonItem *cancelButton;
@property (strong, nonatomic) UILabel *infoLabel;
@property (strong, nonatomic) UITextField *emailAddressTextField;
@property (strong, nonatomic) UITextField *displayNameTextField;
@property (strong, nonatomic) UITextField *imageURLTextField;

@end
