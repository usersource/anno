# UserSource Customization Guide

Your app has a distinctive UI. Wouldn't you want the your feedback mechaism to look and feel the same, giving your users a seamless experience? We’ve provided easy and powerful hooks for you to do exactly that. 

## Matching your app’s look and feel

Edit _www/anno/common/scripts/plugin_settings/pluginConfig.json_ to modify style properties:

* `highlightColorHEX` sets the annotation color. Default is _orange_.
* `loadingIndicatorColorHEX` is the loading spinner color. 
* `annotationWidth` sets the width of annotation lines
* The action icons on the main annotation screen can be over-ridden with icons you provide. To do this, define paths relative to the _www/anno/custom_ folder:
	* `AnnoDrawCommentIcon`
	* `AnnoDrawArrowIcon`
	* `AnnoDrawBlackRectangleIcon`
	* `AnnoDrawRectangleIcon`
	* `AnnoDrawShareIcon`
	* `AnnoDrawCancelIcon`

Further modifications can be made by editing _www/anno/custom/home.css_ and _www/anno/custom/draw.css_.

## UI and Features

### Shake Settings and Gesture Support

The default method for users to access the plugin is to shake their device. To enable shake, you create a custom view containing these components:

* `UISwitch` for allowing/disallowing shake
* `UIPickerView` for changing shake sensitivity

For instance, in iOS:

``` objectivec
AnnoSingleton *anno = [AnnoSingleton sharedInstance];
NSArray *shakeSensitivityData = anno.shakeSensitivityValues; // list of string value for changing number of shakes needed to show plugin UIActionSheet
BOOL allowShake = anno.allowShake; // value to know shaking is on/off
NSInteger shakeValue = anno.shakeValue; // number of shakes needed to show plugin UIActionSheet

[anno saveAllowShake:<YES/NO>]; // for allow/disallowing shake
[anno saveShakeValue:<index of shakeSensitivityData>]; // for changing number of shakes
```

### Showing new activity count notification

Add following code in `viewDidLoad` method

``` objectivec
if ([[AnnoSingleton sharedInstance] respondsToSelector:@selector(notificationsForTarget:performSelector:)]) {
        dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, 1 * NSEC_PER_SEC);
        dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
            [[AnnoSingleton sharedInstance] notificationsForTarget:self performSelector:@selector(usersourceNotifications:)];
        });
}
```

Add following method to show alert:

``` objectivec
(void) usersourceNotifications:(NSNumber*)count {
    if ([count intValue] > 0) {
        NSString *message = @"New activity on %d item";
        if ([count intValue] > 1) {
            message = [message stringByAppendingString:@"s"];
        }
        NSString *msg = [[NSString alloc] initWithFormat:message, [count intValue]];
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Your Feedback"
                                   message:msg
                                  delegate:self
                         cancelButtonTitle:@"Later"
                         otherButtonTitles:@"Show Me", nil];
        [alert setTag:1001];
        [alert show];
    }
}
```

Add following method to show feedback list on clicking of _Show Me_:

``` objectivec
(void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex{
    if (alertView.tag == 1001 && buttonIndex == 1) {
        [[AnnoSingleton sharedInstance] showCommunityPage];
    }
}
```

If your file already has the function above included, use an `alertView` tag and `buttonIndex` to go to the feedback list page.

# API Reference

## showCommunityPage
Shows feedback list page.

``` objectivec
(void) showCommunityPage
```

## setInfoViewControllerClass
Shows custom info page.

``` objectivec
(void) setInfoViewControllerClass:(Class)customInfoViewControllerClass
```

**Parameters**
`customInfoViewControllerClass`: class of custom info view controller which you want to show