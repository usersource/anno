#import <UIKit/UIKit.h>
#import <UserSourceStatic/UserSourceStatic.h>

@interface InfoViewController : UIViewController <UIPickerViewDataSource, UIPickerViewDelegate> {
    UINavigationBar *navigationBar;
    UINavigationItem *navItem;
    UIBarButtonItem *cancelButton;
    UILabel *titleLabel;
    UIImageView *imageView;
    UIView *shakeSettings;
    UIView *shakeSettingsHeader;
    UILabel *shakeSettingsHeaderLabel;
    UIView *shakeSettingsBody;
    UIView *shakeDetection;
    UILabel *shakeDetectionLabel;
    UISwitch *shakeDetectionSwitch;
    UIImageView *shakeDetectionSeparator;
    UIView *shakeSensitivity;
    UILabel *shakeSensitivityLabel;
    UIButton *shakeSensitivityValue;
    UIPickerView *shakeSensitivityPicker;
    UIImageView *shakeSensitivitySeparator;
    UIButton *viewFeedback;
    UIImageView *viewFeedbackSeparator;

    AnnoSingleton *anno;
    NSArray *shakeSensitivityData;
    BOOL allowShake;
    NSInteger shakeValue;
}

@end
