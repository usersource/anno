import logging
import stripe

class StripePayment(object):
    @classmethod
    def create_charge(cls, token_message):
        stripe.api_key = "sk_test_tIiaUWNgm1zeJDzjoE7WOoUO"
        payment_success = False

        try:
            charge = stripe.Charge.create(amount=1000, currency="usd", source=token_message.id)
            if charge.paid and (charge.status == "succeeded"):
                payment_success = True
        except stripe.CardError, e:
            logging.exception("Error while charging customer: %s" % e)

        return payment_success
