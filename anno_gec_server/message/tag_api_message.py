from protorpc import messages

class TagMessage(messages.Message):
    text = messages.StringField(1)
    total = messages.IntegerField(2)

class TagPopularMessage(messages.Message):
    '''
    '''
    tags = messages.MessageField(TagMessage, 1, repeated=True)
