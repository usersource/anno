import logging
from os import environ
from google.appengine.api import app_identity


# Client ID for web application
JS_CLIENT_ID_PROD_USERSOURCE = "22913132792.apps.googleusercontent.com"
JS_CLIENT_ID_TEST_USERSOURCE = "394023691674-7j5afcjlibblt47qehnsh3d4o931orek.apps.googleusercontent.com"
JS_CLIENT_ID_SANDBOX_USERSOURCE = "955803277195.apps.googleusercontent.com"

# support email id
PROD_USERSOURCE_EMAIL_ID = "UserSource Support <support@annoserver.appspotmail.com>"
TEST_USERSOURCE_EMAIL_ID = "UserSource Support <support@annoserver-test.appspotmail.com>"
SANDBOX_USERSOURCE_EMAIL_ID = "UserSource Support <support@usersource-anno.appspotmail.com>"

# Project ID
DEFAULT_HOST_PROD_USERSOURCE = "annoserver.appspot.com"
DEFAULT_HOST_TEST_USERSOURCE = "annoserver-test.appspot.com"
DEFAULT_HOST_SANDBOX_USERSOURCE = "usersource-anno.appspot.com"

# Key for server applications
GCM_API_KEY_PROD_USERSOURCE = "AIzaSyD11tLsJXp9HNHWd33ZGvzCwbxjeMlkryk"
GCM_API_KEY_TEST_USERSOURCE = "AIzaSyApUUBZe5Gborkwd-UknUvHdm9oblPSn9k"
GCM_API_KEY_SANDBOX_USERSOURCE = "AIzaSyCNWf_rZCovDez9Dmzx7CA-m6IHHUmh-SU"

# APNS push certificates
APNS_PUSH_CERT_PROD_USERSOURCE = "APNS_Certificates/<WE-NEED-A-FILE>.pem"
APNS_PUSH_CERT_TEST_USERSOURCE = "APNS_Certificates/PushChatCert.pem"
APNS_PUSH_CERT_SANDBOX_USERSOURCE = "APNS_Certificates/PushChatCert.pem"

# APNS push key
APNS_PUSH_KEY_PROD_USERSOURCE = "APNS_Certificates/<WE-NEED-A-FILE>.pem"
APNS_PUSH_KEY_TEST_USERSOURCE = "APNS_Certificates/PushChatKey.pem"
APNS_PUSH_KEY_SANDBOX_USERSOURCE = "APNS_Certificates/PushChatKey.pem"

# Default values
anno_js_client_id = JS_CLIENT_ID_SANDBOX_USERSOURCE
GCM_API_KEY = GCM_API_KEY_SANDBOX_USERSOURCE
APNS_PUSH_CERT = APNS_PUSH_CERT_SANDBOX_USERSOURCE
APNS_PUSH_KEY = APNS_PUSH_KEY_SANDBOX_USERSOURCE
APNS_USE_SANDBOX = False

SUPPORT_EMAIL_ID = SANDBOX_USERSOURCE_EMAIL_ID

# Enhanced Mode does not quite work on GAE Dev
# https://groups.google.com/forum/#!topic/google-appengine/P-1Gpwpry7w
APNS_ENHANCED = False

# Figure out where we are running
_default_hostname = app_identity.get_default_version_hostname()

# Prod server
if _default_hostname == DEFAULT_HOST_PROD_USERSOURCE:
    anno_js_client_id = JS_CLIENT_ID_PROD_USERSOURCE
    GCM_API_KEY = GCM_API_KEY_PROD_USERSOURCE
    APNS_PUSH_CERT = APNS_PUSH_CERT_PROD_USERSOURCE
    APNS_PUSH_KEY = APNS_PUSH_KEY_PROD_USERSOURCE
    APNS_USE_SANDBOX = False
    SUPPORT_EMAIL_ID = PROD_USERSOURCE_EMAIL_ID

# Test server
elif _default_hostname == DEFAULT_HOST_TEST_USERSOURCE:
    anno_js_client_id = JS_CLIENT_ID_TEST_USERSOURCE
    GCM_API_KEY = GCM_API_KEY_TEST_USERSOURCE
    APNS_PUSH_CERT = APNS_PUSH_CERT_TEST_USERSOURCE
    APNS_PUSH_KEY = APNS_PUSH_KEY_TEST_USERSOURCE
    APNS_USE_SANDBOX = False
    SUPPORT_EMAIL_ID = TEST_USERSOURCE_EMAIL_ID

# Dev server
elif _default_hostname == DEFAULT_HOST_SANDBOX_USERSOURCE:
    anno_js_client_id = JS_CLIENT_ID_SANDBOX_USERSOURCE
    GCM_API_KEY = GCM_API_KEY_SANDBOX_USERSOURCE
    APNS_PUSH_CERT = APNS_PUSH_CERT_SANDBOX_USERSOURCE
    APNS_PUSH_KEY = APNS_PUSH_KEY_SANDBOX_USERSOURCE
    APNS_USE_SANDBOX = False
    SUPPORT_EMAIL_ID = SANDBOX_USERSOURCE_EMAIL_ID

# Are we in the local development environment
DEVELOPMENT = False
if "Development" in environ.get("SERVER_SOFTWARE", ""):
    DEVELOPMENT = True

logging.getLogger().info("Running on %s, under development: %s", _default_hostname, DEVELOPMENT)

# Must be upfront before importing APNS
# http://stackoverflow.com/questions/16192916/importerror-no-module-named-ssl-with-dev-appserver-py-from-google-app-engine/16937668#16937668
# Are we Development
if DEVELOPMENT:
    import sys

    # Add to the Whitelist
    from google.appengine.tools.devappserver2.python import sandbox
    sandbox._WHITE_LIST_C_MODULES += ["_ssl", "_socket"]

    # Use the stdlib Python socket rather than Googles wrapped stub
    from lib import socket as patched_socket
    sys.modules["socket"] = patched_socket
    socket = patched_socket

    # Dev Keys and certificates
    GCM_API_KEY = GCM_API_KEY_SANDBOX_USERSOURCE  # Already existing Public Key for Google Services
    APNS_PUSH_CERT = "APNS_Certificates/aps_development.pem"
    APNS_PUSH_KEY = "APNS_Certificates/PushNotificationsDev.pem"

    # Use the APNS sandbox environment
    APNS_USE_SANDBOX = True
