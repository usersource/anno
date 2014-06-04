__author__ = "rekenerd"

'''
ProtoRPC message class definitions for Community API.
'''

from protorpc import messages
from protorpc import message_types

from message.user_message import UserMessage

class CommunityMessage(messages.Message):
    id = messages.IntegerField(1)
    name = messages.StringField(2, required=True)
    description = messages.StringField(3)
    welcome_msg = messages.StringField(4)
    type = messages.StringField(5, required=True)
    created = message_types.DateTimeField(6)
    user = messages.MessageField(UserMessage, 7, required=True)
    
class UserRoleCommunityMessage(messages.Message):
    id = messages.IntegerField(1, required=True)
