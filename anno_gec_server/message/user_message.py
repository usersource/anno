__author__ = 'topcircler'

from protorpc import messages


class UserMessage(messages.Message):
    id = messages.IntegerField(1)
    user_id = messages.StringField(2)
    user_email = messages.StringField(3)