__author__ = "rekenerd"

'''
ProtoRPC message class definitions for UserRole API.
'''

from protorpc import messages
from protorpc import message_types

from message.user_message import UserMessage
from message.common_message import FieldIDMessage

class UserRoleMessage(messages.Message):
    id = messages.IntegerField(1)
    user = messages.MessageField(UserMessage, 2, required=True)
    community = messages.MessageField(FieldIDMessage, 3, required=True)
    role = messages.StringField(4)
