from protorpc import messages
from message.anno_api_messages import AnnoListMessage

class AccountMessage(messages.Message):
    user_email = messages.StringField(1)
    password = messages.StringField(2)
    display_name = messages.StringField(3)
    auth_source = messages.StringField(4)
    team_key = messages.StringField(5)
    team_secret = messages.StringField(6)
    user_image_url = messages.StringField(7)
    get_feeds = messages.BooleanField(8)

class AccountAuthenticateMessage(messages.Message):
    authenticated = messages.BooleanField(1)
    display_name = messages.StringField(2)
    image_url = messages.StringField(3)
    team_name = messages.StringField(4)
    team_key = messages.StringField(5)
    user_team_token = messages.StringField(6)
    feed_data = messages.MessageField(AnnoListMessage, 7)
