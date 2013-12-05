__author__ = 'topcircler'

from protorpc import messages
from protorpc import message_types

from message.user_message import UserMessage


class FlagMessage(messages.Message):
    """
    Represents flag message.
    """
    id = messages.IntegerField(1)
    anno_id = messages.IntegerField(2)
    creator = messages.MessageField(UserMessage, 3)
    created = message_types.DateTimeField(4)


class FlagListMessage(messages.Message):
    """
    ProtoRPC message definition to represent a list of stored flag.
    """
    flag_list = messages.MessageField(FlagMessage, 1, repeated=True)
    cursor = messages.StringField(2)
    has_more = messages.BooleanField(3)