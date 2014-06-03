__author__ = 'rekenerd'

"""
Community API implemented using Google Cloud Endpoints.
"""

import logging

import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote
from google.appengine.ext.db import BadValueError

from message.community_api_message import CommunityMessage
from model.community import Community
from api.utils import anno_js_client_id

@endpoints.api(name='community', version='1.0', description='Community API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class CommunityApi(remote.Service):
    """
    Class which defines Community API v1.
    """
    @endpoints.method(CommunityMessage, message_types.VoidMessage, path='community', http_method='POST', name='community.insert')
    def community_insert(self, request):
        try:
            Community.insert(request)
        except BadValueError as e:
            logging.exception("Exception while inserting community: %s" % e)
        return message_types.VoidMessage()
    
        