'''
ProtoRPC message class definitions for Community API.
'''

from protorpc import messages
from protorpc import message_types

from message.user_message import UserMessage
from message.user_message import CreateUserMessage
from message.user_message import UserAdminMasterMessage
from message.appinfo_message import AppInfoMessage
from message.common_message import StripePaymentMessage

class CommunityMessage(messages.Message):
    id = messages.IntegerField(1)
    name = messages.StringField(2)
    description = messages.StringField(3)
    welcome_msg = messages.StringField(4)
    type = messages.StringField(5)
    apps = messages.MessageField(AppInfoMessage, 6)
    created = message_types.DateTimeField(7)
    user = messages.MessageField(UserMessage, 8)
    team_key = messages.StringField(9)
    team_secret = messages.StringField(10)
    plan = messages.StringField(11)

class CommunityAdminMasterMessage(messages.Message):
    community_name = messages.StringField(1)
    team_key = messages.StringField(2)
    team_secret = messages.StringField(3)
    team_hash = messages.StringField(4)
    app_name = messages.StringField(5)
    app_icon = messages.StringField(6)
    plan = messages.StringField(7)
    users = messages.MessageField(UserAdminMasterMessage, 8, repeated=True)

class CommunityCircleMembersMessage(messages.Message):
    circle_name = messages.StringField(1)
    users = messages.MessageField(UserAdminMasterMessage, 2, repeated=True)

class CommunityCircleMembersListMessage(messages.Message):
    circle_list = messages.MessageField(CommunityCircleMembersMessage, 1, repeated=True)
    roles = messages.StringField(2, repeated=True)

class CreateCommunityMessage(messages.Message):
    community_name = messages.StringField(1)
    team_key = messages.StringField(2)
    app = messages.MessageField(AppInfoMessage, 3)
    admin_user = messages.MessageField(CreateUserMessage, 4)
    other_users = messages.MessageField(CreateUserMessage, 5, repeated=True)
    plan = messages.StringField(6)

class CreateProCommunityMessage(messages.Message):
    community = messages.MessageField(CreateCommunityMessage, 1)
    stripe_token = messages.MessageField(StripePaymentMessage, 2)

class UpdateCommunityPlanMessage(messages.Message):
    team_key = messages.StringField(1)
    stripe_token = messages.MessageField(StripePaymentMessage, 2)
    plan = messages.StringField(3)

class CommunityAdminMasterListMessage(messages.Message):
    communities = messages.MessageField(CommunityAdminMasterMessage, 1, repeated=True)

class CommunityHashResponseMessage(messages.Message):
    id = messages.IntegerField(1)
    app_name = messages.StringField(2)
    app_icon = messages.StringField(3)
    team_key = messages.StringField(4)

class CommunityAppInfoMessage(messages.Message):
    community = messages.MessageField(CommunityMessage, 1)
    app = messages.MessageField(AppInfoMessage, 2)

class CommunityUserMessage(messages.Message):
    user = messages.MessageField(UserMessage, 1)
    role = messages.StringField(2)
    status = messages.StringField(3)

class CommunityUserListMessage(messages.Message):
    user_list = messages.MessageField(CommunityUserMessage, 1, repeated=True)

class CommunityUserRoleMessage(messages.Message):
    user_id = messages.IntegerField(1)
    user_email = messages.StringField(2)
    community_id = messages.IntegerField(3)
    role = messages.StringField(4)
    include_invite=messages.BooleanField(5, default=False)
    user_display_name = messages.StringField(6)
    user_password = messages.StringField(7)
    team_key = messages.StringField(8)
    user_image_url = messages.StringField(9)
    circle = messages.StringField(10)

class CommunityInviteMessage(messages.Message):
    name = messages.StringField(1)
    email = messages.StringField(2, required=True)
    role = messages.StringField(3)
    invite_msg = messages.StringField(4)
    community = messages.IntegerField(5, required=True)

class CreateInviteResponseMessage(messages.Message):
    user_name = messages.StringField(1)
    user_email = messages.StringField(2)
    invite_msg = messages.StringField(3)
    community = messages.StringField(4)

class CommunityValueMessage(messages.Message):
    name = messages.StringField(1)
    key = messages.StringField(2)
    secret = messages.StringField(3)
    user_team_token = messages.StringField(4)

class CommunityValueListMessage(messages.Message):
    teams = messages.MessageField(CommunityValueMessage, 1, repeated=True)

class CommunityTeamKeyEditMessage(messages.Message):
    team_key = messages.StringField(1)
    new_team_key = messages.StringField(2)
