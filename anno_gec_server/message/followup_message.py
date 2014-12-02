__author__ = 'topcircler'

from protorpc import message_types
from protorpc import messages

from message.user_message import UserMessage


class FollowupMessage(messages.Message):
    """
    Represents follow up message.
    """
    id = messages.IntegerField(1)
    anno_id = messages.IntegerField(2)
    creator = messages.MessageField(UserMessage, 3)
    created = message_types.DateTimeField(4)
    comment = messages.StringField(5)
    tagged_users = messages.StringField(6, repeated=True)
    tagged_users_detail = messages.MessageField(UserMessage, 7, repeated=True)
    team_key = messages.StringField(8)


class FollowupListMessage(messages.Message):
    """
    ProtoRPC message definition to represent a list of stored follow up.
    """
    followup_list = messages.MessageField(FollowupMessage, 1, repeated=True)
    cursor = messages.StringField(2)
    has_more = messages.BooleanField(3)