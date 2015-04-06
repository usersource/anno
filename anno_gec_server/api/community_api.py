'''
Community API implemented using Google Cloud Endpoints.
'''
import json

import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from helper.settings import anno_js_client_id
from helper.utils import get_user_from_request
from helper.utils_enum import InvitationStatusType, UserRoleType, AuthSourceType
from helper.utils import auth_user
from helper.utils import is_auth_user_admin
from helper.utils import getAppInfo
from helper.utils import md5
from helper.utils import send_added_user_email
from helper.utils import update_user_team_token
from message.community_message import CommunityMessage
from message.community_message import CreateCommunityMessage
from message.community_message import CommunityHashResponseMessage
from message.community_message import CommunityAppInfoMessage
from message.community_message import CommunityUserMessage
from message.community_message import CommunityUserListMessage
from message.community_message import CommunityUserRoleMessage
from message.community_message import CommunityInviteMessage
from message.community_message import CreateInviteResponseMessage
from message.community_message import CommunityValueMessage
from message.community_message import CommunityValueListMessage
from message.community_message import CommunityAdminMasterMessage
from message.community_message import CommunityAdminMasterListMessage
from message.community_message import CommunityCircleMembersMessage
from message.community_message import CommunityCircleMembersListMessage
from message.community_message import CommunityTeamKeyEditMessage
from message.user_message import UserMessage
from message.user_message import UserAdminMasterMessage
from message.appinfo_message import AppInfoMessage
from message.common_message import ResponseMessage
from model.community import Community
from model.userrole import UserRole
from model.user import User
from model.invite import Invite
from model.appinfo import AppInfo

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
        team_hash=messages.StringField(1),
        team_key=messages.StringField(2),
        get_user_list=messages.BooleanField(3)
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

    @endpoints.method(CommunityMessage, ResponseMessage, path="community/update",
                      http_method="POST", name="community.update")
    def community_update(self, request):
        if not is_auth_user_admin(headers=self.request_state.headers):
            return ResponseMessage(success=False)

        Community.update(request)
        return ResponseMessage(success=True)

    @endpoints.method(CommunityTeamKeyEditMessage, ResponseMessage, path="community/teamkey/update",
                      http_method="POST", name="community.teamkey.update")
    def community_teamkey_update(self, request):
        if not is_auth_user_admin(headers=self.request_state.headers):
            return ResponseMessage(success=False)

        Community.update_teamkey(request)
        new_user_team_token = update_user_team_token(headers=self.request_state.headers, team_key=request.new_team_key)
        return ResponseMessage(success=True, msg=json.dumps(new_user_team_token))

    @endpoints.method(CommunityAdminMasterMessage, ResponseMessage, path="community/appicon/update",
                      http_method="POST", name="community.appicon.update")
    def community_appicon_update(self, request):
        if not is_auth_user_admin(headers=self.request_state.headers):
            return ResponseMessage(success=False)

        Community.update_appicon(request)
        return ResponseMessage(success=True)

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
        action_user = auth_user(self.request_state.headers)
        user = get_user_from_request(user_id=request.user_id,
                                     user_email=request.user_email,
                                     team_key=request.team_key)

        if not user:
            user = User.insert_user(request.user_email,
                                    username=request.user_display_name,
                                    account_type=request.team_key,
                                    auth_source=AuthSourceType.PLUGIN,
                                    password=md5(request.user_password),
                                    image_url=request.user_image_url or "")

        community = Community.getCommunityFromTeamKey(request.team_key) if request.team_key else Community.get_by_id(request.community_id)
        role = request.role if request.role else UserRoleType.MEMBER

        resp = None
        if user and community:
            circle = 0
            for circle_value, circle_name in community.circles.iteritems():
                if circle_name == request.circle:
                    circle = int(circle_value)

            resp = UserRole.insert(user, community, role, circle)
            send_added_user_email(community.name, user.display_name, "added", action_user.display_name, community.team_hash)

        return ResponseMessage(success=True if resp else False)

    @endpoints.method(CommunityUserRoleMessage, ResponseMessage, path="user/update",
                      http_method="POST", name="user.update")
    def update_user(self, request):
        user = get_user_from_request(user_id=request.user_id,
                                     user_email=request.user_email,
                                     team_key=request.team_key)

        if user:
            user.display_name = request.user_display_name or user.display_name
            user.password = md5(request.user_password) if request.user_password else user.password
            user.image_url = request.user_image_url or user.image_url or ""
            user.put()

        community = Community.getCommunityFromTeamKey(request.team_key) if request.team_key else Community.get_by_id(request.community_id)

        resp = None
        if user and community:
            circle = 0
            for circle_value, circle_name in community.circles.iteritems():
                if circle_name == request.circle:
                    circle = int(circle_value)

            resp = UserRole.edit(user, community, request.role, circle)

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

    @endpoints.method(community_without_id_resource_container, CommunityAdminMasterListMessage,
                      path="community/admin_master_data", http_method="GET", name="community.admin_master")
    def get_admin_master_data(self, request):
        communities_message = []
        query = Community.query().filter(Community.team_secret != None)

        if request.team_key:
            query = query.filter(Community.team_key == request.team_key)

        communities = query.fetch()

        for community in communities:
            community_message = CommunityAdminMasterMessage()
            community_message.community_name = community.name
            community_message.team_key = community.team_key
            community_message.team_secret = community.team_secret
            community_message.team_hash = community.team_hash

            app = community.apps[0].get()
            if app:
                community_message.app_name = app.name
                community_message.app_icon = app.icon_url

            community_message.users = []
            if request.get_user_list:
                for userrole in UserRole.community_user_list(community_key=community.key):
                    user = userrole.user.get()
                    if user and (user.account_type == community.team_key):
                        if user.user_email.split("@")[1] == "devnull.usersource.io":
                            break

                        user_message = UserAdminMasterMessage()
                        user_message.display_name = user.display_name
                        user_message.user_email = user.user_email
                        user_message.password_present = True if user.password else False
                        user_message.role = userrole.role
                        user_message.image_url = user.image_url
                        if community.circles:
                            user_message.circle = community.circles.get(str(userrole.circle_level))
                        community_message.users.append(user_message)

            communities_message.append(community_message)

        return CommunityAdminMasterListMessage(communities=communities_message)

    @endpoints.method(CreateCommunityMessage, CommunityAdminMasterListMessage,
                      path="community/create_sdk_community", http_method="POST", name="community.create_sdk_community")
    def create_sdk_community(self, request):
        team_key = request.team_key
        app_name = request.app_name
        community_name = request.community_name

        app = AppInfo.query().filter(AppInfo.lc_name == app_name.lower()).get()
        if not app:
            appinfo_message = AppInfoMessage()
            appinfo_message.name = app_name
            app = AppInfo.insert(appinfo_message)

        community = Community.getCommunityFromTeamKey(team_key=team_key)
        if not community:
            community_message = CommunityMessage(name=community_name,
                                                 team_key=team_key,
                                                 team_secret=md5(community_name.lower()))
            community_message.user = UserMessage(user_email=request.admin_user.user_email,
                                                 display_name=request.admin_user.display_name,
                                                 password=request.admin_user.password)
            community, user = Community.insert(community_message, getCommunity=True)

        communities_message = []
        if community and app:
            if not app.key in community.apps:
                community.apps.append(app.key)
                community.put()

            # response message
            community_message = CommunityAdminMasterMessage()
            community_message.community_name = community.name
            community_message.team_key = community.team_key
            community_message.team_secret = community.team_secret
            community_message.team_hash = community.team_hash
            community_message.app_name = app.name
            community_message.app_icon = app.icon_url

            community_message.users = []
            user_message = UserAdminMasterMessage()
            user_message.display_name = user.display_name
            user_message.user_email = user.user_email
            user_message.password_present = True if user.password else False
            user_message.role = UserRole.getRole(user, community)
            user_message.image_url = user.image_url

            if community.circles:
                user_message.circle = community.circles.get(str(UserRole.getCircleLevel(user, community)))

            community_message.users.append(user_message)
            communities_message.append(community_message)

        return CommunityAdminMasterListMessage(communities=communities_message)

    @endpoints.method(community_without_id_resource_container, CommunityCircleMembersListMessage,
                      path="community/circle/users/list", http_method="GET", name="community.circle.users.list")
    def get_circle_users(self, request):
        roles = [UserRoleType.MEMBER, UserRoleType.ADMIN]
        community = Community.getCommunityFromTeamKey(request.team_key)

        circle_list_message = []
        for circle_value, circle_name in community.circles.items():
            circle_message = CommunityCircleMembersMessage()
            circle_message.circle_name = circle_name
            circle_message.users = []

            for userrole in UserRole.getUsersByCircle(community.key, int(circle_value)):
                user = userrole.user.get()
                if user and (user.account_type == community.team_key):
                    if user.user_email.split("@")[1] == "devnull.usersource.io":
                        break

                    user_message = UserAdminMasterMessage()
                    user_message.display_name = user.display_name
                    user_message.user_email = user.user_email
                    user_message.password_present = True if user.password else False
                    user_message.role = userrole.role
                    user_message.image_url = user.image_url
                    circle_message.users.append(user_message)

            circle_list_message.append(circle_message)

        return CommunityCircleMembersListMessage(circle_list=circle_list_message, roles=roles)

    @endpoints.method(community_without_id_resource_container, CommunityValueMessage,
                      path="community/teamsecret/reset", http_method="POST", name="community.teamsecret.reset")
    def reset_team_secret(self, request):
        if not is_auth_user_admin(headers=self.request_state.headers):
            return CommunityValueMessage(secret=None)

        secret = Community.reset_team_secret(request.team_key)
        new_user_team_token = update_user_team_token(headers=self.request_state.headers, team_secret=secret)
        return CommunityValueMessage(secret=secret, user_team_token=json.dumps(new_user_team_token))
