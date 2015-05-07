# Remote_API Authentication configuration.

# See google/appengine/ext/remote_api/handler.py for more information.
# In most cases, you will not want to configure this.

from google.appengine.ext import vendor

trusted_appid = ["annoserver", "annoserver-test", "usersource-anno"]
remoteapi_CUSTOM_ENVIRONMENT_AUTHENTICATION = ("HTTP_X_APPENGINE_INBOUND_APPID", trusted_appid)

# Add any libraries installed in the "lib" folder.
vendor.add('lib')
