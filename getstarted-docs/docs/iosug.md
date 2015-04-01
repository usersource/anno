# Developer Guide for iOS / Objective C

Just a few minutes of your time will enable you to start collecting awesome feedback from your user community!

## Step 1: Register

If you haven’t already, [register]('/register') your app (or your project) to get a FREE activation code. 

## Step 2: Download the SDK

Download the latest [iOS SDK](sdk.md)

## Step 3: Extract the SDK

Double-click the package to extract its contents. You now have a folder `UserSourceStatic.framework_package` containing:

	UserSourceStatic.framework_package
	|-- config.xml
	|-- UserSourceStatic.framework
	|-- Cordova.framework
	`-- www

## Step 4: Drop the SDK into your project

1. Drop the “Cordova.framework” and “UserSourceStatic.framework” into your project’s Frameworks folder.
2. Copy the `www` folder and `config.xml` into your project’s root folder.
	* Use the _create folder references_ option, don’t use _create groups_
	* Confirm that the UserSource `config.xml` appears in _Build phases > Copy bundle resources_
3. Add these frameworks in your project’s _General > Linked Frameworks and Libraries_:
	* `MobileCoreServices.framework`
	* `AssetsLibrary.framework`
	* `libsqlite3.dylib`
	* **Note**: Cordova should appear last in _Linked Frameworks and Libraries_
4. Ensure the -ObjC flag is enabled in Build Settings > Linking > Other Linking Flags (here’s help if you need it)

**Note**: _Please use the version of Cordova we supply. If your app already contains Cordova, please email info@usersource.io to check on compatibility of plugins._


## Step 5: Activate the SDK

Add this line in your _ApplicationDelegate_ file, e.g. in `YourAppDelegate.m`: 

	#import <UserSourceStatic/UserSourceStatic.h>

Access the [Accounts](/accounts) tab of the dashboard and obtain the _key_ and _secret_. You will pass these to the SDK in your code.

The next step depends on whether your app knows your user’s email. 

### My app knows the user’s email
In your `didFinishLaunchingWithOptions` handler, use this method to initialize the SDK:

	[[AnnoSingleton sharedInstance] setupWithEmail:<email> displayName:<name> userImageURL:<url> teamKey:@<key> teamSecret:@<secret>];

### My app doesn't know the user’s email

In your `didFinishLaunchingWithOptions` handler, use this method to initialize the SDK:

	[[AnnoSingleton sharedInstance] setupAnonymousUserWithteamKey:@<key> teamSecret:@<secret>];

**Note**: both anonymous feedback and normal feedback are possible in your app. For example, to allow your users to give feedback prior to sign-in, you can enable the `setupAnonymousUserWithteamKey` option. After the user signs-in, switch the `AnnoSingleton` instance to have the `setupWithEmail` option. 

To activate Feedback using a shake gesture, follow these steps. To use another UI approach, see the [UserSource Customization Guide](ioscg).

	[[AnnoSingleton sharedInstance] enableShakeGesture];

**That’s it, the SDK is installed and configured!**

Many developers want to customize UserSource so it looks and feels exactly like the rest of their app. We’ve provided easy and powerful hooks for you to do exactly that. 

Read the [UserSource Customization Guide](ioscg).
