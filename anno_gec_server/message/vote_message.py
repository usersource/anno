__author__ = 'topcircler'

from protorpc import messages
from protorpc import message_types


class VoteMessage(messages.Message):
    """
    Reprensents vote message.
    """
    id = messages.IntegerField(1)
    anno_id = messages.IntegerField(2)
    user_id = messages.IntegerField(3)
    create_time = message_types.DateTimeField(4)


class VoteListMessage(messages.Message):
    """
    ProtoRPC message definition to represent a list of stored vote.
    """
    vote_list = messages.MessageField(VoteMessage, 1, repeated=True)
    cursor = messages.StringField(2)
    has_more = messages.BooleanField(3)