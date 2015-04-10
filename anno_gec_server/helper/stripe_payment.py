import logging
import stripe

class StripePayment(object):
    @classmethod
    def create_charge(cls, token_message):
        stripe.api_key = "sk_test_tIiaUWNgm1zeJDzjoE7WOoUO"

        try:
            charge = stripe.Charge.create(
                amount=1000,
                currency="usd",
                source=token_message.id
            )
        except stripe.CardError, e:
            logging.exception("Error while charging customer: %s" % e)
