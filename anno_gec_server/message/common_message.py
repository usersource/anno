__author__ = "rekenerd"

from protorpc import messages

class ResponseMessage(messages.Message):
    success = messages.BooleanField(1)
    msg = messages.StringField(2)

class InviteResponseMessage(messages.Message):
    recipients = messages.StringField(1, repeated=True)
    message = messages.StringField(2, required=True)
    subject = messages.StringField(3, required=True)
