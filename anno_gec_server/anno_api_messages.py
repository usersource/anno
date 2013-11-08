__author__ = 'topcircler'

"""
ProtoRPC message class definitions for Anno API.
"""

from protorpc import messages
from protorpc import message_types


class AnnoMessage(messages.Message):
    """
    ProtoRPC message definition to represent an insert/update request annotation and response annotation.
    This is used in insert and update api.
    No need to pass user key.
    """
    id = messages.IntegerField(1)
    anno_text = messages.StringField(2, required=True)
    x = messages.FloatField(3, required=True)
    y = messages.FloatField(4, required=True)
    image = messages.BytesField(5) #todo add required=True
    anno_type = messages.StringField(6, default='simple comment')
    is_circle_on_top = messages.BooleanField(7, required=True)
    is_moved = messages.BooleanField(8, required=True)
    level = messages.IntegerField(9, required=True)
    model = messages.StringField(10)
    app_name = messages.StringField(11)
    app_version = messages.StringField(12)
    os_name = messages.StringField(13)
    os_version = messages.StringField(14)
    create_time = message_types.DateTimeField(15)


class AnnoMergeMessage(messages.Message):
    """
    ProtoRPC message definition to represent a merge annotation(no id, all fields are optional)
    No need to pass user key.
    """
    anno_text = messages.StringField(2)
    x = messages.FloatField(3)
    y = messages.FloatField(4)
    image = messages.BytesField(5)
    anno_type = messages.StringField(6)
    is_circle_on_top = messages.BooleanField(7)
    is_moved = messages.BooleanField(8)
    level = messages.IntegerField(9)
    model = messages.StringField(10)
    app_name = messages.StringField(11)
    app_version = messages.StringField(12)
    os_name = messages.StringField(13)
    os_version = messages.StringField(14)
    create_time = message_types.DateTimeField(15)


class AnnoResponseMessage(messages.Message):
    id = messages.IntegerField(1)
    anno_text = messages.StringField(2)
    x = messages.FloatField(3)
    y = messages.FloatField(4)
    image = messages.BytesField(5)
    anno_type = messages.StringField(6)
    is_circle_on_top = messages.BooleanField(7)
    is_moved = messages.BooleanField(8)
    level = messages.IntegerField(9)
    model = messages.StringField(10)
    app_name = messages.StringField(11)
    app_version = messages.StringField(12)
    os_name = messages.StringField(13)
    os_version = messages.StringField(14)
    create_time = message_types.DateTimeField(15)
    creator_key = messages.IntegerField(16)


class AnnoListMessage(messages.Message):
    """
    ProtoRPC message definition to represent a list of stored anno.
    """
    anno_list = messages.MessageField(AnnoResponseMessage, 1, repeated=True)
    cursor = messages.StringField(2)
    has_more = messages.BooleanField(3)