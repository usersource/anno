"""
ProtoRPC message class definitions for Anno API.
"""

from protorpc import messages
from protorpc import message_types

from message.user_message import UserMessage
from message.followup_message import FollowupMessage
from message.community_message import CommunityMessage

class AnnoMessage(messages.Message):
    """
    ProtoRPC message definition to represent an insert/update request annotation and response annotation.
    This is used in insert and update api.
    No need to pass user key.
    """
    id = messages.IntegerField(1) #:
    anno_text = messages.StringField(2, required=True) #:
#     simple_x = messages.FloatField(3, required=True) #:
#     simple_y = messages.FloatField(4, required=True) #:
    image = messages.BytesField(5)  #todo add required=True #:
    anno_type = messages.StringField(6, default='simple comment') #:
#     simple_circle_on_top = messages.BooleanField(7, required=True) #:
#     simple_is_moved = messages.BooleanField(8, required=True) #:
    level = messages.IntegerField(9, required=True) #:
    device_model = messages.StringField(10) #:
    app_name = messages.StringField(11) #:
    app_version = messages.StringField(12) #:
    os_name = messages.StringField(13) #:
    os_version = messages.StringField(14) #:
    created = message_types.DateTimeField(15) #:
    # temporary for copy tool
    creator_id = messages.StringField(16) #:
    draw_elements = messages.StringField(17) #:
    screenshot_is_anonymized = messages.BooleanField(18) #:
    geo_position = messages.StringField(19) #:
    latitude = messages.FloatField(20) #:
    longitude = messages.FloatField(21) #:
    community_name = messages.StringField(22) #:
    platform_type = messages.StringField(23) #:
    team_key = messages.StringField(24) #:
    user_email = messages.StringField(25) #:
    circle_level = messages.IntegerField(26) #:
    screen_info = messages.StringField(27) #:


class AnnoMergeMessage(messages.Message):
    """
    ProtoRPC message definition to represent a merge annotation(no id, all fields are optional)
    No need to pass user key.
    """
    anno_text = messages.StringField(2) #:
#     simple_x = messages.FloatField(3) #:
#     simple_y = messages.FloatField(4) #:
    image = messages.BytesField(5) #:
    anno_type = messages.StringField(6) #:
#     simple_circle_on_top = messages.BooleanField(7) #:
#     simple_is_moved = messages.BooleanField(8) #:
    level = messages.IntegerField(9) #:
    device_model = messages.StringField(10) #:
    app_name = messages.StringField(11) #:
    app_version = messages.StringField(12) #:
    os_name = messages.StringField(13) #:
    os_version = messages.StringField(14) #:
    created = message_types.DateTimeField(15) #:
    draw_elements = messages.StringField(16) #:
    screenshot_is_anonymized = messages.BooleanField(17) #:
    geo_position = messages.StringField(18) #:
    team_key = messages.StringField(19) #:


class AnnoResponseMessage(messages.Message):
    '''
    response message for an individual anno
    '''

    id = messages.IntegerField(1)    #:
    anno_text = messages.StringField(2)  #:
#     simple_x = messages.FloatField(3)   #:
#     simple_y = messages.FloatField(4)  #:
    image = messages.BytesField(5)  #:
    anno_type = messages.StringField(6)  #:
#     simple_circle_on_top = messages.BooleanField(7)  #:
#     simple_is_moved = messages.BooleanField(8)  #:
    level = messages.IntegerField(9)  #:
    device_model = messages.StringField(10)  #:
    app_name = messages.StringField(11)  #:
    app_version = messages.StringField(12)  #:
    os_name = messages.StringField(13)  #:
    os_version = messages.StringField(14)  #:
    created = message_types.DateTimeField(15)  #:
    creator = messages.MessageField(UserMessage, 16)  #:
    is_my_vote = messages.BooleanField(17)  #: add this properties special for get anno api.
    is_my_flag = messages.BooleanField(18)  #: add this properties special for get anno api.
    followup_list = messages.MessageField(FollowupMessage, 19, repeated=True)  #:
    draw_elements = messages.StringField(20)  #:
    screenshot_is_anonymized = messages.BooleanField(21)  #:
    geo_position = messages.StringField(22)  #:
    vote_count = messages.IntegerField(23)  #:
    flag_count = messages.IntegerField(24)  #:
    followup_count = messages.IntegerField(25)  #:
    activity_count = messages.IntegerField(26)  #:
    last_update_time = message_types.DateTimeField(27)  #:
    last_activity = messages.StringField(28)  #:
    latitude = messages.FloatField(29)  #:
    longitude = messages.FloatField(30)  #:
    country = messages.StringField(31)  #:
    last_update_type = messages.StringField(32)  #:
    community = messages.MessageField(CommunityMessage, 33)  #:
    app_icon_url = messages.StringField(34)
    anno_read_status = messages.BooleanField(35)
    last_activity_user = messages.MessageField(UserMessage, 36)
    circle_level_value = messages.StringField(37)

class AnnoTagsResponseMessage(messages.Message):
    value = messages.StringField(1)

class AnnoMentionsResponseMessage(messages.Message):
    id = messages.IntegerField(1)
    user_email = messages.StringField(2)
    display_name = messages.StringField(3)
    image_url = messages.StringField(4)
    is_auth_user = messages.BooleanField(5)

class AnnoTeamNotesMetadataMessage(messages.Message):
    tags = messages.MessageField(AnnoTagsResponseMessage, 1, repeated=True)
    mentions = messages.MessageField(AnnoMentionsResponseMessage, 2, repeated=True)

class AnnoDashboardResponseMessage(messages.Message):
    id = messages.IntegerField(1)
    anno_text = messages.StringField(2)
    image = messages.BytesField(3)
    device_model = messages.StringField(4)
    app_name = messages.StringField(5)
    app_version = messages.StringField(6)
    os_name = messages.StringField(7)
    os_version = messages.StringField(8)
    created = message_types.DateTimeField(9)
    creator = messages.MessageField(UserMessage, 10)
    is_my_vote = messages.BooleanField(11)
    is_my_flag = messages.BooleanField(12)
    followup_list = messages.MessageField(FollowupMessage, 13, repeated=True)
    draw_elements = messages.StringField(14)
    vote_count = messages.IntegerField(15)
    flag_count = messages.IntegerField(16)
    followup_count = messages.IntegerField(17)
    team_notes = messages.StringField(18)
    team_notes_metadata = messages.MessageField(AnnoTeamNotesMetadataMessage, 19)
    engaged_users = messages.MessageField(UserMessage, 20, repeated=True)

class AnnoListMessage(messages.Message):
    """
    ProtoRPC message definition to represent a list of stored anno.
    """
    anno_list = messages.MessageField(AnnoResponseMessage, 1, repeated=True) #:
    cursor = messages.StringField(2) #:
    has_more = messages.BooleanField(3) #:
    offset = messages.IntegerField(4) #:

class AnnoDashboardListMessage(messages.Message):
    anno_list = messages.MessageField(AnnoDashboardResponseMessage, 1, repeated=True)
    cursor = messages.StringField(2)
    has_more = messages.BooleanField(3)
    offset = messages.IntegerField(4)

class UserUnreadMessage(messages.Message):
    unread_count = messages.IntegerField(1)
