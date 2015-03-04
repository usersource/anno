'''
Community API implemented using Google Cloud Endpoints.
'''

import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from helper.settings import anno_js_client_id
from helper.utils import get_user_from_request
from helper.utils_enum import InvitationStatusType
from helper.utils import auth_user
from helper.utils import getAppInfo
from message.community_message import CommunityMessage
from message.community_message import CommunityHashResponseMessage
from message.community_message import CommunityAppInfoMessage
from message.community_message import CommunityUserMessage
from message.community_message import CommunityUserListMessage
from message.community_message import CommunityUserRoleMessage
from message.community_message import CommunityInviteMessage
from message.community_message import CreateInviteResponseMessage
from message.community_message import CommunityValueMessage
from message.community_message import CommunityValueListMessage
from message.user_message import UserMessage
from message.common_message import ResponseMessage
from model.community import Community
from model.userrole import UserRole
from model.user import User
from model.invite import Invite

@endpoints.api(name="community", version="1.0", description="Community API",
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class CommunityApi(remote.Service):

    community_with_id_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.IntegerField(2, required=True),
        include_invite=messages.BooleanField(3, default=False),
        team_hash=messages.StringField(4)
    )

    community_without_id_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        team_hash=messages.StringField(1)
    )

    community_with_circles_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.IntegerField(2, required=True),
        circle_name=messages.StringField(3),
        circle_value=messages.IntegerField(4)
    )

    community_welcome_msg_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.IntegerField(2, required=True),
        welcome_msg=messages.StringField(3, required=True)
    )

    @endpoints.method(community_with_id_resource_container, CommunityMessage,
                      path="community/{id}", http_method="GET", name="community.get")
    def community_get(self, request):
        return Community.getCommunity(community_id=request.id)

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

    @endpoints.method(community_with_circles_resource_container, ResponseMessage, path="circle",
                      http_method="POST", name="circle.insert")
    def insert_circle(self, request):
        resp = Community.addCircle(request)
        return ResponseMessage(success=True if resp else False)

    @endpoints.method(community_with_id_resource_container, CommunityUserListMessage,
                      path="userlist/{id}", http_method="GET", name="user.list")
    def user_list(self, request):
        community_user_message_list = []

        status = InvitationStatusType.ACCEPTED
        userroles = UserRole.community_user_list(request.id)
        for userrole in userroles:
            user = userrole.user.get()
            if user:
                user_message = UserMessage(id=user.key.id(), display_name=user.display_name, user_email=user.user_email)
                community_user_message = CommunityUserMessage(user=user_message, role=userrole.role, status=status)
                community_user_message_list.append(community_user_message)

        if request.include_invite:
            status = InvitationStatusType.PENDING
            from model.invite import Invite
            invited_users = Invite.list_by_community(request.id)
            for invited_user in invited_users:
                user_message = UserMessage(display_name=invited_user.name, user_email=invited_user.email)
                community_user_message = CommunityUserMessage(user=user_message, role=invited_user.role, status=status)
                community_user_message_list.append(community_user_message)

        return CommunityUserListMessage(user_list=community_user_message_list)

    @endpoints.method(CommunityUserRoleMessage, ResponseMessage, path="user",
                      http_method="POST", name="user.insert")
    def insert_user(self, request):
        user = get_user_from_request(user_id=request.user_id, user_email=request.user_email)
        community = Community.get_by_id(request.community_id)
        role = request.role if request.role else None

        resp = None
        if user and community:
            resp = UserRole.insert(user, community, role)

        return ResponseMessage(success=True if resp else False)

    @endpoints.method(CommunityUserRoleMessage, ResponseMessage, path="user",
                      http_method="DELETE", name="user.delete")
    def delete_user(self, request):
        user = get_user_from_request(user_id=request.user_id, user_email=request.user_email)
        community = Community.get_by_id(request.community_id)
        success = False

        if community:
            if user:
                UserRole.delete(user, community)
                success = True
            elif request.include_invite:
                Invite.delete(request.user_email, community)
                success = True

        return ResponseMessage(success=success)

    @endpoints.method(CommunityUserRoleMessage, ResponseMessage, path="user/edit_role",
                      http_method="POST", name="user.edit_role")
    def edit_user_role(self, request):
        user = get_user_from_request(user_id=request.user_id, user_email=request.user_email)
        community = Community.get_by_id(request.community_id)
        resp = None

        if community:
            if user:
                resp = UserRole.edit(user, community, request.role)
            elif request.include_invite:
                resp = Invite.change_user_role(request.user_email, community, request.role)

        return ResponseMessage(success=True if resp else False)

    @endpoints.method(community_welcome_msg_resource_container, ResponseMessage, path="edit_welcome_msg/{id}",
                      http_method="POST", name="community.edit_welcome_msg")
    def edit_welcome_msg(self, request):
        community = Community.get_by_id(request.id)

        if community:
            community.welcome_msg = request.welcome_msg
            community.put()
            return ResponseMessage(success=True)
        else:
            return ResponseMessage(success=False)

    @endpoints.method(CommunityInviteMessage, CreateInviteResponseMessage, path="invite",
                      http_method="POST", name="invite.create")
    def invite_user(self, request):
        creator = auth_user(self.request_state.headers)
        community_name = Invite.create(request, creator)
        invite_msg = request.invite_msg or ""
        return CreateInviteResponseMessage(user_name=request.name, user_email=request.email,
                                           invite_msg=invite_msg, community=community_name)

    @endpoints.method(community_without_id_resource_container, CommunityValueListMessage, path="community/list",
                      http_method="GET", name="community.list")
    def list_community(self, request):
        community_value_list = []
        if request.team_hash == "us3rs0urc3":
            community_list = Community.query().filter(Community.team_key != None).fetch()
            for community in community_list:
                community_value_list.append(CommunityValueMessage(name=community.name,
                                                                  key=community.team_key,
                                                                  secret=community.team_secret))
        return CommunityValueListMessage(teams=community_value_list)

    @endpoints.method(community_without_id_resource_container, CommunityHashResponseMessage,
                      path="community/hash", http_method="GET", name="community.hash")
    def get_community_by_hash(self, request):
        community = Community.get_by_hash(request.team_hash)
        community_app = getAppInfo(team_key=community.team_key)
        return CommunityHashResponseMessage(team_key=community.team_key,
                                            app_name=community_app.name,
                                            app_icon=community_app.icon_url)
