#import "InfoViewController.h"

@interface InfoViewController ()

@end

@implementation InfoViewController

- (id) init {
    self = [super init];

    if (self) {
        anno = [AnnoSingleton sharedInstance];
        shakeSensitivityData = anno.shakeSensitivityValues;
        allowShake = anno.allowShake;
        shakeValue = anno.shakeValue;
    }

    return self;
}

- (void) setUIComponentsConstraints {
    navigationBar.translatesAutoresizingMaskIntoConstraints = NO;
    titleLabel.translatesAutoresizingMaskIntoConstraints = NO;
    imageView.translatesAutoresizingMaskIntoConstraints = NO;
    shakeSettings.translatesAutoresizingMaskIntoConstraints = NO;
    shakeSettingsHeader.translatesAutoresizingMaskIntoConstraints = NO;
    shakeSettingsHeaderLabel.translatesAutoresizingMaskIntoConstraints = NO;
    shakeSettingsBody.translatesAutoresizingMaskIntoConstraints = NO;
    shakeDetection.translatesAutoresizingMaskIntoConstraints = NO;
    shakeDetectionLabel.translatesAutoresizingMaskIntoConstraints = NO;
    shakeDetectionSwitch.translatesAutoresizingMaskIntoConstraints = NO;
    shakeDetectionSeparator.translatesAutoresizingMaskIntoConstraints = NO;
    shakeSensitivity.translatesAutoresizingMaskIntoConstraints = NO;
    shakeSensitivityLabel.translatesAutoresizingMaskIntoConstraints = NO;
    shakeSensitivityValue.translatesAutoresizingMaskIntoConstraints = NO;
    shakeSensitivityPicker.translatesAutoresizingMaskIntoConstraints = NO;
    shakeSensitivitySeparator.translatesAutoresizingMaskIntoConstraints = NO;
    viewFeedback.translatesAutoresizingMaskIntoConstraints = NO;
    viewFeedbackSeparator.translatesAutoresizingMaskIntoConstraints = NO;

    NSDictionary *views = NSDictionaryOfVariableBindings(navigationBar, titleLabel, imageView,
                                                         shakeSettings, shakeSettingsHeader,
                                                         shakeSettingsHeaderLabel, shakeSettingsBody,
                                                         shakeDetection, shakeDetectionLabel,
                                                         shakeDetectionSwitch, shakeSensitivity,
                                                         shakeSensitivityLabel, shakeSensitivityValue,
                                                         shakeSensitivityPicker, viewFeedback,
                                                         shakeDetectionSeparator, shakeSensitivitySeparator,
                                                         viewFeedbackSeparator);

    [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[navigationBar]-0-|"
                                                                      options:0
                                                                      metrics:nil
                                                                        views:views]];

    [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|-0-[navigationBar(65)]"
                                                                      options:0
                                                                      metrics:nil
                                                                        views:views]];

    [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-10-[titleLabel]-10-|"
                                                                      options:0
                                                                      metrics:nil
                                                                        views:views]];

    [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[navigationBar]-14-[titleLabel]"
                                                                      options:0
                                                                      metrics:nil
                                                                        views:views]];

    [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-25-[imageView]-25-|"
                                                                      options:0
                                                                      metrics:nil
                                                                        views:views]];

    [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[titleLabel]-20-[imageView(140)]"
                                                                      options:0
                                                                      metrics:nil
                                                                        views:views]];

    [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[shakeSettings]-0-|"
                                                                      options:0
                                                                      metrics:nil
                                                                        views:views]];

    [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[imageView]-20-[shakeSettings(175)]"
                                                                      options:0
                                                                      metrics:nil
                                                                        views:views]];

    [shakeSettings addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[shakeSettingsHeader]-0-|"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];

    [shakeSettings addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|-0-[shakeSettingsHeader(25)]"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];

    [shakeSettingsHeader addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-18-[shakeSettingsHeaderLabel]-18-|"
                                                                                options:0
                                                                                metrics:nil
                                                                                  views:views]];

    [shakeSettingsHeader addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|-0-[shakeSettingsHeaderLabel(25)]"
                                                                                options:0
                                                                                metrics:nil
                                                                                  views:views]];

    [shakeSettings addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-18-[shakeSettingsBody]-18-|"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];

    [shakeSettings addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[shakeSettingsHeader]-0-[shakeSettingsBody(150)]"
                                                                          options:0
                                                                          metrics:nil
                                                                            views:views]];

    [shakeSettingsBody addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[shakeDetection]-0-|"
                                                                              options:0
                                                                              metrics:nil
                                                                                views:views]];

    [shakeSettingsBody addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|-0-[shakeDetection(50)]"
                                                                              options:0
                                                                              metrics:nil
                                                                                views:views]];

    [shakeDetection addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[shakeDetectionLabel]"
                                                                           options:0
                                                                           metrics:nil
                                                                             views:views]];

    [shakeDetection addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|-0-[shakeDetectionLabel]-0-|"
                                                                           options:0
                                                                           metrics:nil
                                                                             views:views]];

    [shakeDetection addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:[shakeDetectionSwitch]-0-|"
                                                                           options:0
                                                                           metrics:nil
                                                                             views:views]];

    [shakeDetection addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|-10-[shakeDetectionSwitch(30)]"
                                                                           options:0
                                                                           metrics:nil
                                                                             views:views]];

    [shakeDetection addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[shakeDetectionSeparator]-0-|"
                                                                           options:0
                                                                           metrics:nil
                                                                             views:views]];

    [shakeDetection addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[shakeDetectionSeparator]-0-|"
                                                                           options:0
                                                                           metrics:nil
                                                                             views:views]];

    [shakeSettingsBody addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[shakeSensitivity]-0-|"
                                                                              options:0
                                                                              metrics:nil
                                                                                views:views]];

    [shakeSettingsBody addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[shakeDetection]-0-[shakeSensitivity(50)]"
                                                                              options:0
                                                                              metrics:nil
                                                                                views:views]];

    [shakeSensitivity addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[shakeSensitivityLabel]"
                                                                            options:0
                                                                            metrics:nil
                                                                              views:views]];

    [shakeSensitivity addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|-0-[shakeSensitivityLabel]-0-|"
                                                                            options:0
                                                                            metrics:nil
                                                                              views:views]];

    [shakeSensitivity addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:[shakeSensitivityValue]-0-|"
                                                                            options:0
                                                                            metrics:nil
                                                                              views:views]];

    [shakeSensitivity addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|-0-[shakeSensitivityValue(50)]-0-|"
                                                                            options:0
                                                                            metrics:nil
                                                                              views:views]];

    [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[shakeSensitivityPicker]-0-|"
                                                                      options:0
                                                                      metrics:nil
                                                                        views:views]];

    [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|-65-[shakeSensitivityPicker]"
                                                                      options:0
                                                                      metrics:nil
                                                                        views:views]];

    [shakeSensitivity addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[shakeSensitivitySeparator]-0-|"
                                                                            options:0
                                                                            metrics:nil
                                                                              views:views]];

    [shakeSensitivity addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[shakeSensitivitySeparator]-0-|"
                                                                            options:0
                                                                            metrics:nil
                                                                              views:views]];

    [shakeSettingsBody addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[viewFeedback]-0-|"
                                                                              options:0
                                                                              metrics:nil
                                                                                views:views]];

    [shakeSettingsBody addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[shakeSensitivity]-0-[viewFeedback(50)]"
                                                                              options:0
                                                                              metrics:nil
                                                                                views:views]];

    [shakeSettingsBody addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-0-[viewFeedbackSeparator]-0-|"
                                                                              options:0
                                                                              metrics:nil
                                                                                views:views]];

    [shakeSettingsBody addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[viewFeedbackSeparator]-0-|"
                                                                              options:0
                                                                              metrics:nil
                                                                                views:views]];
}

- (void) setUI {
    navItem = [[UINavigationItem alloc] init];
    navigationBar = [[UINavigationBar alloc] init];
    navItem.title = @"Feedback";
    [self.view addSubview:navigationBar];
    navigationBar.items = [NSArray arrayWithObjects: navItem, nil];
    [navigationBar setBackgroundImage:[UIImage imageNamed:@"info-overlay.png"] forBarMetrics:UIBarMetricsDefault];
    
    UIImage *backImage = [UIImage imageNamed:@"icon_arrow-left.png"];
    UIButton *backButton = [UIButton buttonWithType:UIButtonTypeCustom];
    backButton.bounds = CGRectMake( 6, 0, backImage.size.width, backImage.size.height);
    [backButton setImage:backImage forState:UIControlStateNormal];
    backButton.imageView.contentMode = UIViewContentModeCenter;
    [backButton addTarget:self action:@selector(closeInfo:) forControlEvents:UIControlEventTouchUpInside];
    cancelButton = [[UIBarButtonItem alloc] initWithCustomView:backButton];

    navItem.leftBarButtonItem = cancelButton;

    titleLabel = [[UILabel alloc] init];
    [self.view addSubview:titleLabel];
    titleLabel.text = @"Shake to Share Feedback";
    titleLabel.numberOfLines = 1;
    titleLabel.textAlignment = NSTextAlignmentCenter;
    titleLabel.textColor = [UIColor whiteColor];

    imageView = [[UIImageView alloc] initWithFrame:CGRectZero];
    imageView.image = [UIImage imageNamed:@"Demonstaration"];
    imageView.contentMode = UIViewContentModeScaleAspectFit;
    [self.view addSubview:imageView];

    shakeSettings = [[UIView alloc] init];
    [self.view addSubview:shakeSettings];
    
    shakeSettingsHeader = [[UIView alloc] init];
    shakeSettingsHeader.backgroundColor = [UIColorFromRGB(0x151a20) colorWithAlphaComponent:0.5];
    [shakeSettings addSubview:shakeSettingsHeader];

    shakeSettingsHeaderLabel = [[UILabel alloc] init];
    shakeSettingsHeaderLabel.text = @"SHAKE SETTINGS";
    shakeSettingsHeaderLabel.textColor = UIColorFromRGB(0x9b9b9b);
    shakeSettingsHeaderLabel.baselineAdjustment = UIBaselineAdjustmentAlignCenters;
    shakeSettingsHeaderLabel.font = [UIFont fontWithName:@"HelveticaNeue-Light" size:11.0];
    [shakeSettingsHeader addSubview:shakeSettingsHeaderLabel];

    shakeSettingsBody = [[UIView alloc] init];
    [shakeSettings addSubview:shakeSettingsBody];

    shakeDetection = [[UIView alloc] init];
    [shakeSettingsBody addSubview:shakeDetection];

    shakeDetectionLabel = [[UILabel alloc] init];
    shakeDetectionLabel.text = @"Shake Detection";
    shakeDetectionLabel.textColor = UIColorFromRGB(0xb6b6b6);
    shakeDetectionLabel.baselineAdjustment = UIBaselineAdjustmentAlignCenters;
    shakeDetectionLabel.font = [UIFont fontWithName:@"HelveticaNeue-Regular" size:14.0];
    [shakeDetection addSubview:shakeDetectionLabel];

    shakeDetectionSwitch = [[UISwitch alloc] init];
    [shakeDetectionSwitch setOn:allowShake animated:NO];
    [shakeDetectionSwitch addTarget:self action:@selector(changeShakeDetection:) forControlEvents:UIControlEventTouchUpInside];
    [shakeDetection addSubview:shakeDetectionSwitch];
    
    shakeSensitivity = [[UIView alloc] init];
    [shakeSettingsBody addSubview:shakeSensitivity];

    shakeSensitivityLabel = [[UILabel alloc] init];
    shakeSensitivityLabel.text = @"Sensitivity";
    shakeSensitivityLabel.textColor = UIColorFromRGB(0xb6b6b6);
    shakeSensitivityLabel.baselineAdjustment = UIBaselineAdjustmentAlignCenters;
    shakeSensitivityLabel.font = [UIFont fontWithName:@"HelveticaNeue-Regular" size:14.0];
    [shakeSensitivity addSubview:shakeSensitivityLabel];
    
    shakeSensitivityValue = [[UIButton alloc] init];
    NSString *shakeSensitivityTitle = [shakeSensitivityData objectAtIndex:shakeValue];
    [shakeSensitivityValue setTitle:shakeSensitivityTitle forState:UIControlStateNormal];
    [shakeSensitivityValue setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
    shakeSensitivityValue.titleLabel.baselineAdjustment = UIBaselineAdjustmentAlignCenters;
    shakeSensitivityValue.titleLabel.font = [UIFont fontWithName:@"HelveticaNeue-Regular" size:14.0];
    [shakeSensitivityValue addTarget:self action:@selector(showShakePicker:) forControlEvents:UIControlEventTouchUpInside];
    [shakeSensitivity addSubview:shakeSensitivityValue];
    [self disableShakeSensitivity];

    shakeSensitivityPicker = [[UIPickerView alloc] init];
    shakeSensitivityPicker.showsSelectionIndicator = YES;
    shakeSensitivityPicker.hidden = YES;
    shakeSensitivityPicker.delegate = self;
    shakeSensitivityPicker.dataSource = self;
    shakeSensitivityPicker.backgroundColor = UIColorFromRGB(0x151a20);
    [shakeSensitivityPicker selectRow:shakeValue inComponent:0 animated:YES];
    [self.view addSubview:shakeSensitivityPicker];

    viewFeedback = [[UIButton alloc] init];
    [viewFeedback setTitle:@"View Feedback" forState:UIControlStateNormal];
    [viewFeedback setTitleColor:UIColorFromRGB(0x4cc0ff) forState:UIControlStateNormal];
    viewFeedback.titleLabel.baselineAdjustment = UIBaselineAdjustmentAlignCenters;
    viewFeedback.titleLabel.textAlignment = NSTextAlignmentCenter;
    viewFeedback.titleLabel.font = [UIFont fontWithName:@"HelveticaNeue-Regular" size:14.0];
    [viewFeedback addTarget:self action:@selector(showFeedbackPage:) forControlEvents:UIControlEventTouchUpInside];
    [shakeSettingsBody addSubview:viewFeedback];
    
    shakeDetectionSeparator = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"Line"]];
    shakeSensitivitySeparator = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"Line"]];
    viewFeedbackSeparator = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"Line"]];
    [shakeDetection addSubview:shakeDetectionSeparator];
    [shakeSensitivity addSubview:shakeSensitivitySeparator];
    [viewFeedback addSubview:viewFeedbackSeparator];

    [self setUIComponentsConstraints];
}

- (void) loadView {
    [super loadView];
    CGRect applicationFrame = [[UIScreen mainScreen] applicationFrame];
    self.view = [[UIView alloc] initWithFrame:applicationFrame];

    UIImageView *backgroudImageView = [[UIImageView alloc] initWithFrame:applicationFrame];
    backgroudImageView.image = [UIImage imageNamed:@"info-overlay"];
    [self.view addSubview:backgroudImageView];
    [self.view sendSubviewToBack:backgroudImageView];

    [self setUI];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    [self setNeedsStatusBarAppearanceUpdate];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
}

- (void) closeInfo:(id)sender {
    if (self.navigationController == nil) {
        [self dismissViewControllerAnimated:YES completion:nil];
    } else {
        [self.navigationController popViewControllerAnimated:YES];
    }
}

- (void) showFeedbackPage:(id)sender {
    NSLog(@"showFeedbackPage called");
    [[AnnoSingleton sharedInstance] showCommunityPage];
}

- (void) disableShakeSensitivity {
    if (shakeDetectionSwitch.isOn) {
        shakeSensitivityValue.enabled = YES;
        shakeSensitivityLabel.textColor = UIColorFromRGB(0xb6b6b6);
        [shakeSensitivityValue setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
    } else {
        shakeSensitivityValue.enabled = NO;
        shakeSensitivityLabel.textColor = [UIColor grayColor];
        [shakeSensitivityValue setTitleColor:[UIColor grayColor] forState:UIControlStateNormal];
    }
}

- (void) changeShakeDetection:(id)sender {
    NSLog(@"changeShakeDetection called");
    allowShake = shakeDetectionSwitch.isOn;
    [anno saveAllowShake:shakeDetectionSwitch.isOn];
    [self disableShakeSensitivity];
}

- (void) showShakePicker:(id)sender {
    NSLog(@"showShakePicker called");
    shakeSensitivityPicker.hidden = NO;
    navItem.title = @"Shake Sensitivity";

    UIImage *backImage = [UIImage imageNamed:@"Close_icon"];
    UIButton *backButton = [UIButton buttonWithType:UIButtonTypeCustom];
    backButton.bounds = CGRectMake(6, 0, backImage.size.width, backImage.size.height);
    [backButton setImage:backImage forState:UIControlStateNormal];
    backButton.imageView.contentMode = UIViewContentModeCenter;
    [backButton addTarget:self action:@selector(closeShakePicker:) forControlEvents:UIControlEventTouchUpInside];
    navItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithCustomView:backButton];

    backImage = [UIImage imageNamed:@"Icon_done"];
    backButton = [UIButton buttonWithType:UIButtonTypeCustom];
    backButton.bounds = CGRectMake(backImage.size.width - 6, 0, backImage.size.width, backImage.size.height);
    [backButton setImage:backImage forState:UIControlStateNormal];
    backButton.imageView.contentMode = UIViewContentModeCenter;
    [backButton addTarget:self action:@selector(saveShakeSensitivity:) forControlEvents:UIControlEventTouchUpInside];
    navItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithCustomView:backButton];
}

- (void) closeShakePicker:(id)sender {
    shakeSensitivityPicker.hidden = YES;
    navItem.title = @"Feedback";
    navItem.leftBarButtonItem = cancelButton;
    navItem.rightBarButtonItem = nil;
}

- (void) saveShakeSensitivity:(id)sender {
    NSLog(@"saveShakeSensitivity called");
    NSInteger row = [shakeSensitivityPicker selectedRowInComponent:0];
    NSLog(@"row: %ld", (long)row);
    shakeValue = row;
    [anno saveShakeValue:shakeValue];
    [self closeShakePicker:sender];

    NSString *shakeSensitivityTitle = [shakeSensitivityData objectAtIndex:shakeValue];
    [shakeSensitivityValue setTitle:shakeSensitivityTitle forState:UIControlStateNormal];
}

- (NSInteger) numberOfComponentsInPickerView:(UIPickerView *)pickerView {
    return 1;
}

- (NSInteger) pickerView:(UIPickerView *)pickerView numberOfRowsInComponent:(NSInteger)component {
    return [shakeSensitivityData count];
}

- (NSString *) pickerView:(UIPickerView *)pickerView titleForRow:(NSInteger)row forComponent:(NSInteger)component {
    return [shakeSensitivityData objectAtIndex:row];
}

- (UIView *) pickerView:(UIPickerView *)pickerView viewForRow:(NSInteger)row forComponent:(NSInteger)component reusingView:(UIView *)view {
    UILabel *label = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, shakeSensitivityPicker.frame.size.width, 50)];
    label.textColor = [UIColor whiteColor];
    label.font = [UIFont fontWithName:@"HelveticaNeue-Regular" size:14.0];
    label.text = [shakeSensitivityData objectAtIndex:row];
    label.textAlignment = NSTextAlignmentCenter;
    return label;
}

- (UIStatusBarStyle) preferredStatusBarStyle {
    return UIStatusBarStyleLightContent;
}

@end
