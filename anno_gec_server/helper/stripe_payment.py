import logging
import stripe
from helper.utils_enum import PlanType

class PlanPricing(object):
    PRO = 5000
    ENTERPRISE = 50000

class StripePayment(object):
    @classmethod
    def create_charge(cls, token_message, community_key, plan_type):
        stripe.api_key = "sk_test_tIiaUWNgm1zeJDzjoE7WOoUO"
        payment_success = False
        amount = PlanPricing.PRO if (plan_type == PlanType.PRO) else PlanPricing.ENTERPRISE

        try:
            charge = stripe.Charge.create(amount=amount, currency="usd", source=token_message.id)
            if charge.paid and (charge.status == "succeeded"):
                payment_success = True
                from model.payment import Payment
                Payment.create(community_key, charge)
        except stripe.CardError, e:
            logging.exception("Error while charging customer: %s" % e)

        return payment_success
