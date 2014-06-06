__author__ = "rekenerd"

from protorpc import messages

class ResponseMessage(messages.Message):
    success = messages.BooleanField(1)
    msg = messages.StringField(2)
