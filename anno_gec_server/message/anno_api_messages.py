__author__ = 'topcircler'

"""
ProtoRPC message class definitions for Anno API.
"""

from protorpc import messages
from protorpc import message_types

from message.user_message import UserMessage
from message.followup_message import FollowupMessage


class AnnoMessage(messages.Message):
    """
    ProtoRPC message definition to represent an insert/update request annotation and response annotation.
    This is used in insert and update api.
    No need to pass user key.
    """
    id = messages.IntegerField(1)
    anno_text = messages.StringField(2, required=True)
    simple_x = messages.FloatField(3, required=True)
    simple_y = messages.FloatField(4, required=True)
    image = messages.BytesField(5) #todo add required=True
    anno_type = messages.StringField(6, default='simple comment')
    simple_circle_on_top = messages.BooleanField(7, required=True)
    simple_is_moved = messages.BooleanField(8, required=True)
    level = messages.IntegerField(9, required=True)
    device_model = messages.StringField(10)
    app_name = messages.StringField(11)
    app_version = messages.StringField(12)
    os_name = messages.StringField(13)
    os_version = messages.StringField(14)
    created = message_types.DateTimeField(15)
    # temporary for copy tool
    creator_id = messages.StringField(16)


class AnnoMergeMessage(messages.Message):
    """
    ProtoRPC message definition to represent a merge annotation(no id, all fields are optional)
    No need to pass user key.
    """
    anno_text = messages.StringField(2)
    simple_x = messages.FloatField(3)
    simple_y = messages.FloatField(4)
    image = messages.BytesField(5)
    anno_type = messages.StringField(6)
    simple_circle_on_top = messages.BooleanField(7)
    simple_is_moved = messages.BooleanField(8)
    level = messages.IntegerField(9)
    device_model = messages.StringField(10)
    app_name = messages.StringField(11)
    app_version = messages.StringField(12)
    os_name = messages.StringField(13)
    os_version = messages.StringField(14)
    created = message_types.DateTimeField(15)


class AnnoResponseMessage(messages.Message):
    id = messages.IntegerField(1)
    anno_text = messages.StringField(2)
    simple_x = messages.FloatField(3)
    simple_y = messages.FloatField(4)
    image = messages.BytesField(5)
    anno_type = messages.StringField(6)
    simple_circle_on_top = messages.BooleanField(7)
    simple_is_moved = messages.BooleanField(8)
    level = messages.IntegerField(9)
    device_model = messages.StringField(10)
    app_name = messages.StringField(11)
    app_version = messages.StringField(12)
    os_name = messages.StringField(13)
    os_version = messages.StringField(14)
    created = message_types.DateTimeField(15)
    creator = messages.MessageField(UserMessage, 16)
    is_my_vote = messages.BooleanField(17)  # add this properties special for get anno api.
    is_my_flag = messages.BooleanField(18)  # add this properties special for get anno api.
    followup_list = messages.MessageField(FollowupMessage, 19, repeated=True)


class AnnoListMessage(messages.Message):
    """
    ProtoRPC message definition to represent a list of stored anno.
    """
    anno_list = messages.MessageField(AnnoResponseMessage, 1, repeated=True)
    cursor = messages.StringField(2)
    has_more = messages.BooleanField(3)