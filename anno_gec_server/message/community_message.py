'''
ProtoRPC message class definitions for Community API.
'''

from protorpc import messages
from protorpc import message_types

from message.user_message import UserMessage
from message.appinfo_message import AppInfoMessage

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
    community_id = messages.IntegerField(3, required=True)
    role = messages.StringField(4)
    include_invite=messages.BooleanField(5, default=False)

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

class CommunityValueListMessage(messages.Message):
    teams = messages.MessageField(CommunityValueMessage, 1, repeated=True)
