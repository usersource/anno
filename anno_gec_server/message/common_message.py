__author__ = "rekenerd"

from protorpc import messages

class StringMessage(messages.Message):
    msg = messages.StringField(1)

class FieldIDMessage(messages.Message):
    id = messages.IntegerField(1, required=True)
