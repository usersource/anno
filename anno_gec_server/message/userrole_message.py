__author__ = "rekenerd"

'''
ProtoRPC message class definitions for UserRole API.
'''

from protorpc import messages
from protorpc import message_types

from message.user_message import UserMessage
from message.community_message import CommunityMessage

class UserRoleMessage(messages.Message):
    id = messages.IntegerField(1)
    user = messages.MessageField(UserMessage, 2)
    community = messages.MessageField(CommunityMessage, 3)
    role = messages.StringField(4)
