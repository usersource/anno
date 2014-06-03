__author__ = 'rekenerd'

from protorpc import messages

class StringMessage(messages.Message):
    msg = messages.StringField(1)
