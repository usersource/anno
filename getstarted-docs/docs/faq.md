# Frequently Asked Questions

1. _I am getting a JSON encoding error in my Project since I added the Cordova Framework, Help!_.

	**Answer:** Cordova adds to the JSONEncode methods with a Category of it's own. Make sure Cordova is included as the last Framework.

1. _NSString is giving an Error now, seriously help_.

	**Answer:** xCode strips some symbols by default from frameworks. Please add the -ObjC linker flag to your project's Build Settings.

1. _It says it cannot find index.html when I try to run the Plugin_.

	**Answer:** Please make sure the 'www' and 'config.xml' are in the correct folders, in your project.

1. _I keep pressing the 'View Feedback' button, but nothing happens_.

	**Answer:** You need a valid Team Key and Secret to use the UserSource Feedback Plugin. The run logs will usually have the reason printed there. To get a Team Key and Secret, please sign up at www.usersource.io
