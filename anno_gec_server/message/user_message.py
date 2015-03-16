__author__ = 'topcircler'

from protorpc import messages

class UserMessage(messages.Message):
    id = messages.IntegerField(1)
    user_email = messages.StringField(2)
    display_name = messages.StringField(3)
    password = messages.StringField(4)
    auth_source = messages.StringField(5)
    device_id = messages.StringField(6)
    device_type = messages.StringField(7)
    image_url = messages.StringField(8)
    is_auth_user = messages.BooleanField(9)

class UserAdminMasterMessage(messages.Message):
    user_email = messages.StringField(1)
    display_name = messages.StringField(2)
    password_present = messages.BooleanField(3)
    role = messages.StringField(4)
    circle = messages.StringField(5)

class UserCommunityMessage(messages.Message):
    from message.community_message import CommunityMessage
    community = messages.MessageField(CommunityMessage, 1)
    role = messages.StringField(2)

class UserInviteMessage(messages.Message):
    from message.community_message import CommunityMessage
    community = messages.MessageField(CommunityMessage, 1)
    invite_hash = messages.StringField(2, required=True)
    invite_msg = messages.StringField(3)

class UserInviteListMessage(messages.Message):
    invite_list = messages.MessageField(UserInviteMessage, 1, repeated=True)

class UserInviteAcceptMessage(messages.Message):
    invite_hash = messages.StringField(1, required=True)
    user_email = messages.StringField(2, required=True)
    force = messages.BooleanField(3)

class UserCommunityListMessage(messages.Message):
    community_list = messages.MessageField(UserCommunityMessage, 1, repeated=True)
    invite_list = messages.MessageField(UserInviteMessage, 2, repeated=True)

class UserListMessage(messages.Message):
    user_list = messages.MessageField(UserMessage, 1, repeated=True)
