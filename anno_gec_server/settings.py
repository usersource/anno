
# Figure out where we are running
from google.appengine.api import app_identity
_default_hostname = app_identity.get_default_version_hostname()

DEFAULT_HOST_ANNOSERVER = "22913132792.apps.googleusercontent.com"
DEFAULT_HOST_ANNOSERVERTEST = "394023691674-7j5afcjlibblt47qehnsh3d4o931orek.apps.googleusercontent.com"
DEFAULT_HOST_USERSOURCEANNO = "955803277195.apps.googleusercontent.com"

anno_js_client_id = "955803277195.apps.googleusercontent.com"

# Prod server
if _default_hostname == DEFAULT_HOST_ANNOSERVER: 
    anno_js_client_id = DEFAULT_HOST_ANNOSERVER

# Test server
elif _default_hostname == DEFAULT_HOST_ANNOSERVERTEST: 
    anno_js_client_id = DEFAULT_HOST_ANNOSERVERTEST

# Dev server
elif _default_hostname == DEFAULT_HOST_USERSOURCEANNO: 
    anno_js_client_id = DEFAULT_HOST_USERSOURCEANNO

# Are we in the local development environment
from os import environ
DEVELOPMENT = False
if "Development" in environ['SERVER_SOFTWARE']:
    DEVELOPMENT = True

import logging
logging.getLogger().info("Running on %s, under development: %s", _default_hostname, DEVELOPMENT)

# Push Notifications setup
GCM_API_KEY = ''
APNS_PUSH_CERT = 'APNS_Certificates/<WE-NEED-A-FILE>.pem'
APNS_PUSH_KEY = 'APNS_Certificates/<WE-NEED-A-FILE>.pem'
APNS_USE_SANDBOX = False

# Enhanced Mode does not quite work on GAE Dev
# https://groups.google.com/forum/#!topic/google-appengine/P-1Gpwpry7w
APNS_ENHANCED = False

# Must be upfront before importing APNS
# http://stackoverflow.com/questions/16192916/importerror-no-module-named-ssl-with-dev-appserver-py-from-google-app-engine/16937668#16937668
# Are we Development
if DEVELOPMENT:
    import sys

    # Add to the Whitelist
    from google.appengine.tools.devappserver2.python import sandbox
    sandbox._WHITE_LIST_C_MODULES += ['_ssl', '_socket']

    # Use the stdlib Python socket rather than Googles wrapped stub
    from lib import socket as patched_socket
    sys.modules['socket'] = patched_socket
    socket = patched_socket

    # Dev Keys and certificates
    GCM_API_KEY = 'AIzaSyCNWf_rZCovDez9Dmzx7CA-m6IHHUmh-SU' # Already existing Public Key for Google Services
    APNS_PUSH_CERT = 'APNS_Certificates/aps_development.pem'
    APNS_PUSH_KEY = 'APNS_Certificates/PushNotificationsDev.pem'

    # Use the APNS sandbox environment
    APNS_USE_SANDBOX = True
