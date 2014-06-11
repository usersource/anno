__author__ = "rekenerd"

'''
Community API implemented using Google Cloud Endpoints.
'''

import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from api.utils import anno_js_client_id
from message.community_message import CommunityMessage, CommunityAppInfoMessage
from message.common_message import ResponseMessage
from model.community import Community

@endpoints.api(name="community", version="1.0", description="Community API",
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class CommunityApi(remote.Service):

    @endpoints.method(CommunityMessage, ResponseMessage, path="community", http_method="POST", name="community.insert")
    def community_insert(self, request):
        resp = Community.insert(request)
        return ResponseMessage(success=True, msg=resp)
    
    @endpoints.method(CommunityAppInfoMessage, ResponseMessage, path="app", http_method="POST", name="app.insert")
    def app_insert(self, request):
        resp = Community.addApp(request)
        return ResponseMessage(success=True if resp else False)
