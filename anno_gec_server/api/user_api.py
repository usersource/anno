import logging

from google.appengine.ext import ndb
import endpoints
from protorpc import message_types
from protorpc import remote
from protorpc import messages

from helper.settings import anno_js_client_id
from helper.utils import md5
from helper.utils import get_endpoints_current_user
from helper.utils import auth_user
from helper.utils import user_community
from helper.utils import get_user_from_request
from model.user import User
from model.invite import Invite
from model.userrole import UserRole
from model.community import Community
from message.user_message import UserMessage
from message.user_message import UserCommunityMessage
from message.user_message import UserCommunityListMessage
from message.user_message import UserInviteMessage
from message.user_message import UserInviteListMessage
from message.user_message import UserInviteAcceptMessage
from message.user_message import UserListMessage
from message.community_message import CommunityMessage
from message.common_message import ResponseMessage
from message.appinfo_message import UserFavoriteAppList


@endpoints.api(name='user', version='1.0', description='User API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class UserApi(remote.Service):

    user_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        creator_id=messages.StringField(1, required=True)
    )

    user_email_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        email=messages.StringField(1),
        account_type=messages.StringField(2)
    )

    user_email_with_id_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.StringField(1),
        email=messages.StringField(2),
        include_invite=messages.BooleanField(3, default=False)
    )

    user_device_id_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        device_id=messages.StringField(1),
        device_type=messages.StringField(2),
        clear_device=messages.BooleanField(3, default=False)
    )


    @endpoints.method(user_resource_container, message_types.VoidMessage, path='user', http_method='POST',
                      name='user.insert')
    def user_insert(self, request):
        email = request.creator_id + "@gmail.com"
        user = User.find_user_by_email(email)
        if user is None:
            User.insert_user(email=email)
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


    @endpoints.method(user_device_id_resource_container, message_types.VoidMessage,
                      path="user/deviceid/update", http_method="POST", name="user.deviceid.update")
    def update_deviceid(self, request):
        user = auth_user(self.request_state.headers)

        device_id = None if request.clear_device else request.device_id
        device_type = None if request.clear_device else request.device_type

        user.device_id = device_id
        user.device_type = device_type
        user.put()
        return message_types.VoidMessage()


    @endpoints.method(user_email_with_id_resource_container, UserCommunityListMessage,
                      path="community/list", http_method="GET", name="community.list")
    def list_user_communities(self, request):
        if request.id or request.email:
            user = get_user_from_request(user_id=request.id, user_email=request.email)
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

        if request.include_invite and user:
            pending_invites = Invite.list_by_user(user.user_email)
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


    @endpoints.method(user_email_with_id_resource_container, UserFavoriteAppList,
                      path="user/favorite_apps", http_method="GET", name="favorite_apps.list")
    def list_favorite_apps(self, request):
        user = get_user_from_request(user_id=request.id, user_email=request.email)

        if not user:
            user = auth_user(self.request_state.headers)

        return UserFavoriteAppList(app_list=User.list_favorite_apps(user.key))


    @endpoints.method(user_email_resource_container, message_types.VoidMessage,
                      path="user/teamkey/update", http_method="POST", name="user.teamkey.update")
    def update_teamkey(self, request):
        user = User.find_user_by_email(request.email)
        user.account_type = request.account_type
        user.put()
        return message_types.VoidMessage()


    @endpoints.method(user_email_resource_container, UserListMessage,
                      path="user/community/users", http_method="GET", name="user.community.users")
    def community_users(self, request):
        user = auth_user(self.request_state.headers)
        community_userroles = []

        if user:
            community = Community.getCommunityFromTeamKey(request.account_type)
            if community and (UserRole.getCircleLevel(user, community) > 0):
                community_userroles = UserRole.query().filter(ndb.AND(UserRole.community == community.key,
                                                                      UserRole.circle_level > 0)
                                                              ).fetch(projection=[UserRole.user])

        users = []
        for community_userrole in community_userroles:
            current_user = community_userrole.user.get()
            users.append(UserMessage(id=current_user.key.id(),
                                     user_email=current_user.user_email,
                                     display_name=current_user.display_name,
                                     image_url=current_user.image_url))

        # removing auth_user
        [ users.remove(user_info) for user_info in users if user_info.user_email == user.user_email ]

        # sorting users alphabetically
        users = sorted(users, key=lambda user_info: user_info.display_name.lower())

        return UserListMessage(user_list=users)
