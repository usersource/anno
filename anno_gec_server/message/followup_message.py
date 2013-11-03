__author__ = 'topcircler'

from protorpc import message_types
from protorpc import messages


class FollowupMessage(messages.Message):
    """
    Represents follow up message.
    """
    id = messages.IntegerField(1)
    anno_id = messages.IntegerField(2)
    user_id = messages.IntegerField(3)
    create_time = message_types.DateTimeField(4)
    comment = messages.StringField(5)


class FollowupListMessage(messages.Message):
    """
    ProtoRPC message definition to represent a list of stored follow up.
    """
    followup_list = messages.MessageField(FollowupMessage, 1, repeated=True)
    cursor = messages.StringField(2)
    has_more = messages.BooleanField(3)