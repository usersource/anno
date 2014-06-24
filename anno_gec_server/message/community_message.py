__author__ = "rekenerd"

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
    
class CommunityAppInfoMessage(messages.Message):
    community = messages.MessageField(CommunityMessage, 1)
    app = messages.MessageField(AppInfoMessage, 2)

class CommunityUserMessage(messages.Message):
    user = messages.MessageField(UserMessage, 1)
    role = messages.StringField(2)

class CommunityUserListMessage(messages.Message):
    user_list = messages.MessageField(CommunityUserMessage, 1, repeated=True)

class CommunityUserRoleMessage(messages.Message):
    user_id = messages.IntegerField(1)
    user_email = messages.StringField(2)
    community_id = messages.IntegerField(3, required=True)
    role = messages.StringField(4)

class CommunityInviteMessage(messages.Message):
    name = messages.StringField(1)
    email = messages.StringField(2, required=True)
    role = messages.StringField(3)
    invite_msg = messages.StringField(4)
    community = messages.IntegerField(5, required=True)
