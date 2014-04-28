__author__ = 'topcircler'

from protorpc import messages
from protorpc import message_types

class AppInfoMessage(messages.Message):
    """
    ProtoRPC message definition to represent 3rd party app information.
    """
    app_key = messages.StringField(1)
    app_name = messages.StringField(2)
    company_name = messages.StringField(3)
    private_data = messages.BooleanField(4, default=False)
    created = message_types.DateTimeField(5)
    contact_email = messages.StringField(6)
    is_registered = messages.BooleanField(7)
    app_urls = messages.StringField(8)