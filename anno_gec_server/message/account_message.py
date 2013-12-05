__author__ = 'topcircler'

from protorpc import messages


class AccountMessage(messages.Message):
    user_email = messages.StringField(1)
    password = messages.StringField(2)
    display_name = messages.StringField(3)
    auth_source = messages.StringField(4)