__author__ = "rekenerd"

'''
Community API implemented using Google Cloud Endpoints.
'''

import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from api.utils import anno_js_client_id, community_user_list
from message.community_message import CommunityMessage, CommunityAppInfoMessage, CommunityUserMessage, CommunityUserListMessage
from message.user_message import UserMessage
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

    community_with_id_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.IntegerField(2, required=True)
    )

    @endpoints.method(community_with_id_resource_container, CommunityUserListMessage, path="user/{id}",
                      http_method="GET", name="user.get")
    def user_list(self, request):
        community_user_message_list = []

        for userrole in community_user_list(request.id):
            user = userrole.user.get()
            if user:
                user_message = UserMessage(display_name=user.display_name, user_email=user.user_email)
                community_user_message = CommunityUserMessage(user=user_message, role=userrole.role)
                community_user_message_list.append(community_user_message)

        return CommunityUserListMessage(user_list=community_user_message_list)
