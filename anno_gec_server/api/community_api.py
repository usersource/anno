__author__ = "rekenerd"

'''
Community API implemented using Google Cloud Endpoints.
'''

import logging

import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from message.community_message import CommunityMessage
from message.common_message import StringMessage
from model.community import Community
from api.utils import anno_js_client_id

@endpoints.api(name="community", version="1.0", description="Community API",
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class CommunityApi(remote.Service):
    def __init__(self):
        self.communityType = dict(public="public", private="private")

    @endpoints.method(CommunityMessage, StringMessage, path="community", http_method="POST", name="community.insert")
    def community_insert(self, request):
        try:
            # community should be of type 'private' or 'public'
            if not request.type in self.communityType.values():
                respData = StringMessage(msg="Community should be of type 'private' or 'public'")
            # only one public community is allowed
            elif (request.type == self.communityType["public"]):
                queryResultCount = Community.query(Community.type == self.communityType["public"]).count()
                if queryResultCount:
                    respData = StringMessage(msg="Community not created. Can't create more than one public community.")
            else:
                Community.insert(request)
                respData = StringMessage(msg="Community created.")
        except Exception as e:
            logging.exception("Exception while inserting community: %s" % e)
            respData = StringMessage(msg="%s" % e)
        return respData
