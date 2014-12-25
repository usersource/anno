from protorpc import messages

class AccountMessage(messages.Message):
    user_email = messages.StringField(1)
    password = messages.StringField(2)
    display_name = messages.StringField(3)
    auth_source = messages.StringField(4)
    team_key = messages.StringField(5)
    team_secret = messages.StringField(6)
    user_image_url = messages.StringField(7)

class UserTeamTokenMessage(messages.Message):
    display_name = messages.StringField(1)
    image_url = messages.StringField(2)
    team_name = messages.StringField(3)
    team_key = messages.StringField(4)
    user_team_token = messages.StringField(5)

class AccountAuthenticateMessage(messages.Message):
    authenticated = messages.BooleanField(1)
    teams = messages.MessageField(UserTeamTokenMessage, 2, repeated=True)
