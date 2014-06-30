__author__ = 'topcircler'

import logging

import endpoints
from protorpc import message_types
from protorpc import remote
from protorpc import messages

from settings import anno_js_client_id
from api.utils import md5
from api.utils import get_endpoints_current_user
from api.utils import auth_user
from api.utils import user_community
from model.user import User
from model.invite import Invite
from message.user_message import UserMessage
from message.user_message import UserCommunityMessage
from message.user_message import UserCommunityListMessage
from message.user_message import UserInviteMessage
from message.user_message import UserInviteListMessage
from message.user_message import UserInviteAcceptMessage
from message.community_message import CommunityMessage
from message.common_message import ResponseMessage

@endpoints.api(name='user', version='1.0', description='User API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class UserApi(remote.Service):

    user_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        creator_id=messages.StringField(1, required=True)
    )

    user_email_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        email=messages.StringField(1)
    )

    user_deviceid_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        deviceid=messages.StringField(1),
        device_type=messages.StringField(2)
    )

    user_email_with_id_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.StringField(1),
        email=messages.StringField(2),
        include_invite=messages.BooleanField(3, default=False)
    )

    @endpoints.method(user_resource_container, message_types.VoidMessage, path='user', http_method='POST',
                      name='user.insert')
    def user_insert(self, request):
        email = request.creator_id + "@gmail.com"
        user = User.find_user_by_email(email)
        if user is None:
            User.insert_user(email)
            print "user " + request.creator_id + " was inserted."
        else:
            print "user" + request.creator_id + " already exists."
        return message_types.VoidMessage()

    @endpoints.method(user_email_resource_container, UserMessage, path='user/display_name', http_method='GET',
                      name='user.displayname.get')
    def user_display_name_get(self, request):
        if request.email is None:
            # if no email is provided, get user by oauth.
            user = auth_user(self.request_state.headers)
        else:
            # for not login user, get user by the provided email.
            user = User.find_user_by_email(request.email)
        if user is None:
            return UserMessage(display_name='')
        else:
            return UserMessage(display_name=user.display_name)

    @endpoints.method(UserMessage, message_types.VoidMessage, path='user/update_password', http_method='POST',
                      name='user.password.update')
    def update_password(self, request):
        current_user = get_endpoints_current_user(raise_unauthorized=False)
        if current_user is not None:
            raise endpoints.BadRequestException("Google OAuth User can't update password.")
        user = auth_user(self.request_state.headers)
        user.password = md5(request.password)
        user.put()
        return message_types.VoidMessage()

    @endpoints.method(UserMessage, message_types.VoidMessage, path="user/deviceid/update",
                      http_method="POST", name="user.deviceid.update")
    def update_deviceid(self, request):
        user = auth_user(self.request_state.headers)
        user.deviceid = request.deviceid
        user.device_type = request.device_type
        user.put()
        return message_types.VoidMessage()

    @endpoints.method(user_email_with_id_resource_container, UserCommunityListMessage,
                      path="community/list", http_method="GET", name="community.list")
    def list_user_communities(self, request):
        if request.id:
            user = User.get_by_id(int(request.id))
        elif request.email:
            user = User.find_user_by_email(request.email)
        else:
            user = auth_user(self.request_state.headers)

        user_community_list = user_community(user) if user else []
        user_community_message_list = []

        for userrole in user_community_list:
            community = userrole.get("community").get()
            if community:
                community_message = CommunityMessage(id=community.key.id(), name=community.name,
                                                     description=community.description,
                                                     welcome_msg=community.welcome_msg)
                user_community_message = UserCommunityMessage(community=community_message, role=userrole.get("role"))
                user_community_message_list.append(user_community_message)

        pending_invites_list = []

        if request.include_invite:
            pending_invites = Invite.list_by_user(request.email or (auth_user(self.request_state.headers)).user_email)
            for pending_invite in pending_invites:
                community = pending_invite.community.get().to_response_message()
                pending_invites_list.append(UserInviteMessage(community=community,
                                                              invite_hash=pending_invite.invite_hash,
                                                              invite_msg=pending_invite.invite_msg))

        return UserCommunityListMessage(community_list=user_community_message_list, invite_list=pending_invites_list)

    @endpoints.method(user_email_resource_container, UserInviteListMessage, path="invite/list",
                      http_method="GET", name="invite.list")
    def user_invite_list(self, request):
        if request.email is None:
            user = auth_user(self.request_state.headers)
            user_email = user.user_email
        else:
            user_email = request.email

        pending_invites = Invite.list_by_user(user_email)
        pending_invites_list = []

        for pending_invite in pending_invites:
            community = pending_invite.community.get().to_response_message()
            pending_invites_list.append(UserInviteMessage(community=community,
                                                          invite_hash=pending_invite.invite_hash,
                                                          invite_msg=pending_invite.invite_msg))

        return UserInviteListMessage(invite_list=pending_invites_list)

    @endpoints.method(UserInviteAcceptMessage, ResponseMessage, path="invite/accept",
                      http_method="POST", name="invite.accept")
    def user_invite_accept(self, request):
        if request.user_email is None:
            user = auth_user(self.request_state.headers)
            request.user_email = user.user_email

        resp, msg = Invite.accept(request)
        return ResponseMessage(success=True if resp else False, msg=msg)
