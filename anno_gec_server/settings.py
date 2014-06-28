
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