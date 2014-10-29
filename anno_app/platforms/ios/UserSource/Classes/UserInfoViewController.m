//
//  UserInfoViewController.m
//  UserSource
//
//  Created by Imran on 28/10/14.
//
//

#import "UserInfoViewController.h"
#import "AnnoSingleton.h"

@interface UserInfoViewController ()

@end

@implementation UserInfoViewController

@synthesize navigationBar;
@synthesize nextButton, cancelButton;
@synthesize infoLabel;
@synthesize emailAddressTextField, displayNameTextField, imageURLTextField;

- (void) setUIComponentsConstraints {
    NSString *navBarVerticalConstraint;

    NSArray *versionCompatibility = [[UIDevice currentDevice].systemVersion componentsSeparatedByString:@"."];
    NSInteger iOSVersion = [[versionCompatibility objectAtIndex:0] intValue];

    if (iOSVersion == 6) {
        navBarVerticalConstraint = @"V:|-0-[navigationBar(45)]";
    } else if (iOSVersion >= 7) {
        navBarVerticalConstraint = @"V:|-20-[navigationBar(45)]";
    }

    if ([NSLayoutConstraint class]) {
        [navigationBar setTranslatesAutoresizingMaskIntoConstraints:NO];
        [infoLabel setTranslatesAutoresizingMaskIntoConstraints:NO];
        [emailAddressTextField setTranslatesAutoresizingMaskIntoConstraints:NO];
        [displayNameTextField setTranslatesAutoresizingMaskIntoConstraints:NO];
        [imageURLTextField setTranslatesAutoresizingMaskIntoConstraints:NO];
        
        NSDictionary *views = NSDictionaryOfVariableBindings(navigationBar, infoLabel, emailAddressTextField, displayNameTextField, imageURLTextField);

        [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[navigationBar]-0-|"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];
        
        [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:navBarVerticalConstraint
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];
        
        [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-50-[infoLabel]-30-|"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];
        
        [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[navigationBar]-30-[infoLabel]"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];

        [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-10-[emailAddressTextField]-10-|"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];
        
        [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[infoLabel]-30-[emailAddressTextField]"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];
        
        [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-10-[displayNameTextField]-10-|"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];
        
        [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[emailAddressTextField]-15-[displayNameTextField]"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];
        
        [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-10-[imageURLTextField]-10-|"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];
        
        [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[displayNameTextField]-15-[imageURLTextField]"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];
    }
}

- (void) setUI {
    UINavigationItem *navItem = [[UINavigationItem alloc] init];
    navigationBar = [[UINavigationBar alloc] init];
    navItem.title = @"Feedback";
    navigationBar.barTintColor = [UIColor whiteColor];
    [self.view addSubview:navigationBar];
    navigationBar.items = [NSArray arrayWithObjects: navItem, nil];
    
    cancelButton = [[UIBarButtonItem alloc] initWithTitle:@"Close"
                                                    style:UIBarButtonItemStyleDone
                                                   target:self
                                                   action:@selector(cancelUserInfo:)];

    nextButton = [[UIBarButtonItem alloc] initWithTitle:@"Next"
                                                    style:UIBarButtonItemStyleDone
                                                   target:self
                                                   action:@selector(continueFeedback:)];
    nextButton.enabled = NO;

    navItem.leftBarButtonItem = cancelButton;
    navItem.rightBarButtonItem = nextButton;
    
    infoLabel = [[UILabel alloc] init];
    [self.view addSubview:infoLabel];
    infoLabel.text = @"Please enter following details to continue";
    infoLabel.numberOfLines = 2;
    infoLabel.textAlignment = NSTextAlignmentCenter;
    
    emailAddressTextField = [[UITextField alloc] init];
    [self.view addSubview:emailAddressTextField];
    emailAddressTextField.placeholder = @"Email Address";
    emailAddressTextField.clearButtonMode = UITextFieldViewModeWhileEditing;
    emailAddressTextField.borderStyle = UITextBorderStyleRoundedRect;
    emailAddressTextField.keyboardType = UIKeyboardTypeEmailAddress;
    [emailAddressTextField addTarget:self
                              action:@selector(emailAddressTextFieldDidChange:)
                    forControlEvents:UIControlEventEditingChanged];
    
    displayNameTextField = [[UITextField alloc] init];
    [self.view addSubview:displayNameTextField];
    displayNameTextField.placeholder = @"Display Name";
    displayNameTextField.clearButtonMode = UITextFieldViewModeWhileEditing;
    displayNameTextField.borderStyle = UITextBorderStyleRoundedRect;
    
    imageURLTextField = [[UITextField alloc] init];
    [self.view addSubview:imageURLTextField];
    imageURLTextField.placeholder = @"Image URL";
    imageURLTextField.clearButtonMode = UITextFieldViewModeWhileEditing;
    imageURLTextField.borderStyle = UITextBorderStyleRoundedRect;
    
    [self setUIComponentsConstraints];
}

- (void) loadView {
    [super loadView];
    CGRect applicationFrame = [[UIScreen mainScreen] applicationFrame];
    self.view = [[UIView alloc] initWithFrame:applicationFrame];
    self.view.backgroundColor = [UIColor whiteColor];
    [self setUI];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    emailAddressTextField.delegate = self;
}

- (void) didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
}

- (void) emailAddressTextFieldDidChange:(id)sender {
    if ([self validateEmailWithString:emailAddressTextField.text]) {
        nextButton.enabled = YES;
    } else {
        nextButton.enabled = NO;
    }
}

- (BOOL) validateEmailWithString:(NSString*)email {
    NSString *emailRegex = @"[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}";
    NSPredicate *emailTest = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", emailRegex];
    return [emailTest evaluateWithObject:email];
}

- (void) cancelUserInfo:(id)sender {
    NSLog(@"cancel button clicked");
    [self dismissViewControllerAnimated:YES completion:nil];
}

- (void) continueFeedback:(id)sender {
    NSLog(@"next button clicked");

    AnnoSingleton *annoSingleton = (AnnoSingleton*)[AnnoSingleton sharedInstance];
    NSString *displayName, *imageURL;

    if (displayNameTextField.text.length == 0) {
        displayName = annoSingleton.displayName;
    } else {
        displayName = displayNameTextField.text;
    }

    if (imageURLTextField.text.length == 0) {
        imageURL = annoSingleton.userImageURL;
    } else {
        imageURL = imageURLTextField.text;
    }

    annoSingleton.email = emailAddressTextField.text;
    annoSingleton.displayName = displayName;
    annoSingleton.userImageURL = imageURL;

    [self dismissViewControllerAnimated:YES completion:^{
        [annoSingleton showCommunityPage];
    }];
}

@end
