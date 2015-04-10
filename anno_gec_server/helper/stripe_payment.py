import stripe

class StripePayment(object):
    @classmethod
    def create_charge(cls, token_message):
        stripe.api_key = "sk_test_tIiaUWNgm1zeJDzjoE7WOoUO"

        try:
            charge = stripe.Charge.create(
                amount=1000,
                currency="usd",
                source=token_message.id,
                description="payinguser@example.com"
            )
            print charge
        except stripe.CardError, e:
            print e
