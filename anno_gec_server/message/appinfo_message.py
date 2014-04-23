__author__ = 'topcircler'

from protorpc import messages
from protorpc import message_types

class AppInfoMessage(messages.Message):
    """
    ProtoRPC message definition to represent 3rd party app information.
    """
    app_key = messages.StringField(1)
    app_name = messages.StringField(2)
    app_version = messages.StringField(3)
    company_name = messages.StringField(4)
    private_data = messages.BooleanField(5, default=True)
    created = message_types.DateTimeField(6)
    contact_email = messages.StringField(7)
    is_registered = messages.BooleanField(8)