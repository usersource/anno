__author__ = "rekenerd"

'''
ProtoRPC message class definitions for UserRole API.
'''

from protorpc import messages
from protorpc import message_types

from message.user_message import UserMessage
from message.community_message import UserRoleCommunityMessage

class UserRoleMessage(messages.Message):
    id = messages.IntegerField(1)
    user = messages.MessageField(UserMessage, 2, required=True)
    community = messages.MessageField(UserRoleCommunityMessage, 3, required=True)
    role = messages.StringField(4, required=True)
