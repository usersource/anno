__author__ = "rekenerd"

'''
Community API implemented using Google Cloud Endpoints.
'''

import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from api.utils import anno_js_client_id
from message.community_message import CommunityMessage
from message.community_message import CommunityAppInfoMessage
from message.community_message import CommunityUserMessage
from message.community_message import CommunityUserListMessage
from message.community_message import CommunityUserDeleteMessage
from message.community_message import CommunityEditUserRoleMessage
from message.user_message import UserMessage
from message.common_message import ResponseMessage
from model.community import Community
from model.userrole import UserRole
from model.user import User

@endpoints.api(name="community", version="1.0", description="Community API",
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class CommunityApi(remote.Service):

    community_with_id_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.IntegerField(2, required=True)
    )

    @endpoints.method(community_with_id_resource_container, CommunityMessage,
                      path="community/{id}", http_method="GET", name="community.get")
    def community_get(self, request):
        return Community.getCommunity(request.id)

    @endpoints.method(CommunityMessage, ResponseMessage, path="community",
                      http_method="POST", name="community.insert")
    def community_insert(self, request):
        resp = Community.insert(request)
        return ResponseMessage(success=True, msg=resp)

    @endpoints.method(CommunityAppInfoMessage, ResponseMessage, path="app",
                      http_method="POST", name="app.insert")
    def app_insert(self, request):
        resp = Community.addApp(request)
        return ResponseMessage(success=True if resp else False)

    @endpoints.method(community_with_id_resource_container, CommunityUserListMessage,
                      path="userlist/{id}", http_method="GET", name="user.list")
    def user_list(self, request):
        community_user_message_list = []

        for userrole in UserRole.community_user_list(request.id):
            user = userrole.user.get()
            if user:
                user_message = UserMessage(id=user.key.id(), display_name=user.display_name, user_email=user.user_email)
                community_user_message = CommunityUserMessage(user=user_message, role=userrole.role)
                community_user_message_list.append(community_user_message)

        return CommunityUserListMessage(user_list=community_user_message_list)

    @endpoints.method(CommunityUserDeleteMessage, ResponseMessage, path="user",
                      http_method="DELETE", name="user.delete")
    def user_delete(self, request):
        if request.id:
            user = User.get_by_id(request.id)
        elif request.user_email:
            user = User.find_user_by_email(request.email)

        community = Community.get_by_id(request.community_id)

        if user and community:
            UserRole.delete(user, community)
            return ResponseMessage(success=True)
        else:
            return ResponseMessage(success=False)

    @endpoints.method(CommunityEditUserRoleMessage, ResponseMessage, path="edit_user_role",
                      http_method="POST", name="user.edit_user_role")
    def edit_user_role(self, request):
        if request.id:
            user = User.get_by_id(request.id)
        elif request.user_email:
            user = User.find_user_by_email(request.email)

        community = Community.get_by_id(request.community_id)

        if user and community:
            resp = UserRole.edit_user_role(user, community, request.role)

        return ResponseMessage(success=True if resp else False)

    community_welcome_msg_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.IntegerField(2, required=True),
        welcome_msg=messages.StringField(3, required=True)
    )

    @endpoints.method(community_welcome_msg_resource_container, ResponseMessage, path="edit_welcome_msg/{id}",
                      http_method="POST", name="community.edit_welcome_msg")
    def edit_welcome_msg(self, request):
        community = Community.get_by_id(request.id)

        if community:
            community.welcome_msg = request.welcome_msg
            return ResponseMessage(success=True)
        else:
            return ResponseMessage(success=False)
