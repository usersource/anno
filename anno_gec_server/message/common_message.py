from protorpc import messages

class ResponseMessage(messages.Message):
    success = messages.BooleanField(1)
    msg = messages.StringField(2)

class StripePaymentCardMessage(messages.Message):
    id = messages.StringField(1)
    last4 = messages.StringField(2)
    exp_month = messages.IntegerField(3)
    exp_year = messages.IntegerField(4)

class StripePaymentMessage(messages.Message):
    client_ip = messages.StringField(1)
    email = messages.StringField(2)
    id = messages.StringField(3)
    livemode = messages.BooleanField(4)
    card = messages.MessageField(StripePaymentCardMessage, 5)
