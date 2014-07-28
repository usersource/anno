__author__ = 'topcircler'

from protorpc import messages
from protorpc import message_types

class AppInfoMessage(messages.Message):
    """
    ProtoRPC message definition to represent 3rd party app information.
    """
    id = messages.IntegerField(1)
    name = messages.StringField(2)
    icon = messages.BytesField(3)
    icon_url = messages.StringField(4)
    description = messages.StringField(5)
    version = messages.StringField(6)
    developer = messages.StringField(7)
    company_name = messages.StringField(8)
    app_url = messages.StringField(9)
    created = message_types.DateTimeField(10)

class UserFavoriteApp(messages.Message):
    name = messages.StringField(1)
    icon_url = messages.StringField(2)
    version = messages.StringField(3)

class UserFavoriteAppList(messages.Message):
    app_list = messages.MessageField(UserFavoriteApp, 1, repeated=True)
