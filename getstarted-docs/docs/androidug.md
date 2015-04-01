# Developer Guide for Android

Just a few minutes of your time will enable you to start collecting awesome feedback from your user community!

## Step 1: Register

If you haven’t already, [register]('/register') your app (or your project) to get a FREE activation code. 

## Step 2: Download the SDK

Download the latest [Android SDK](sdk.md)

## Step 3: Extract the SDK

Extract its contents. You now have a folder `UserSourceSDKPackage` containing:

	UserSourceSDKPackage
	|-- UserSourceSDK
	`-- www

## Step 4: Drop the SDK into your project

### For Eclipse Setup

Import the UserSource SDK into Eclipse.
1. Go to Eclipse's _File > Import menu_
1. Select _Android > Existing Projects into Workspace_.
1. Browse to the folder where you unzipped the SDK and click _Open_.
1. Uncheck _Copy projects into workspace_. Don’t uncheck `CordovaLib` from project list.
1. Click _Finish_ to import the SDK.

To add the SDK to an existing Android Project in Eclipse, link your project to the UserSource SDK library project you imported.
1. View the properties for your project
1. Click _Android_ tab.
1. Click _Add_
1. Choose _CommunityActivity_ project from the workspace.
1. Copy `www` folder into your project's assets folder.

Please continue with [common setup](#common) after this.

### For Gradle Setup
Import the UserSource SDK into Android Studio.
1. Go to Android Studio’s _File > Import Module_ menu
1. Browse to the folder where you unzipped the SDK and click _Open_.
1. Give module name as `:UserSourceSDK` and finish.
1. Do same for `CordovaLib` folder which is inside unzipped SDK folder and with module name as `:CordovaLib`.

To add the SDK to an existing Gradle project in Android Studio
1. Open project structure window of existing project
1. Go to _Dependencies_ tab.
1. Click _+_ which is on right side and select _Module Dependency_.
1. Select _UserSourceSDK_ and apply.

Please continue with [common setup](#common) after this.

### <a name="common"></a>Common Setup
Finally, update your _Android Manifest_:

1. Open _AndroidManifest.xml_.
1. Add a _uses-permission_ element to the manifest:

``` xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

1. Add following activities to the application element:

``` xml
<activity android:name="io.usersource.anno.CommunityActivity" />
<activity android:name="io.usersource.anno.AnnoDrawActivity" />
<activity
    android:name="io.usersource.annoplugin.shake.ShakeMenu"
    android:theme="@android:style/Theme.Translucent.NoTitleBar.Fullscreen" />
<activity android:name="org.pgsqlite.SQLitePlugin" />
```

## Step 5: Activate the SDK

Add this line in your _Activity_ file:

``` java
import io.usersource.annoplugin.AnnoSingleton;
import io.usersource.annoplugin.shake.ShakeEnabler;
```

and this line inside your class declaration:

``` java
private AnnoSingleton anno = null;
```

Add these line in `onCreate` method (if it exists else create it):

``` java
anno = AnnoSingleton.getInstance(this);
```

Access the [Accounts](/accounts) tab of the dashboard and obtain the _key_ and _secret_. You will pass these to the SDK in your code.

The next step depends on whether your app knows your user’s email. 

### My app knows the user’s email

Use this method to initialize the SDK:

``` java
anno.setupWithUserInfo(<email>, <name>, <url>, <key>, <secret>);
```

### My app doesn't know the user’s email

Use this method to initialize the SDK:

``` java
anno.setupAnonymousUserWithTeamCredentials(<key>, <secret>);
```

!!! note
	Both anonymous feedback and normal feedback are possible in your app. For example, to allow your users to give feedback prior to sign-in, you can enable the `setupAnonymousUserWithTeamCredentials` option. After the user signs-in, switch the anno instance to have the `setupWithUserInfo` option. 

To activate Feedback using a shake gesture, follow these steps. To use another UI approach, see the [UserSource Customization Guide](custg).

``` java 
ShakeEnabler.startListening(this);
```

**That’s it, the SDK is installed and configured!**

Many developers want to customize UserSource so it looks and feels exactly like the rest of their app. We’ve provided easy and powerful hooks for you to do exactly that. 

Read the [UserSource Customization Guide](custg).