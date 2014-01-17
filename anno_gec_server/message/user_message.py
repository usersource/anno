__author__ = 'topcircler'

from protorpc import messages


class UserMessage(messages.Message):
    id = messages.IntegerField(1)
    user_email = messages.StringField(2)
    display_name = messages.StringField(3)
    password = messages.StringField(4)
    auth_source = messages.StringField(5)