import datetime

from google.appengine.ext import ndb

from model.community import Community

class Payment(ndb.Model):
    name = ndb.StringProperty()
    created = ndb.DateTimeProperty()
    balance_transaction = ndb.StringProperty()
    community = ndb.KeyProperty(kind=Community, required=True)

    @classmethod
    def create(cls, community_key, message):
        created = datetime.datetime.fromtimestamp(message.get('created'))
        entity = cls(name=message.get('source').get('name'),
                     created=created,
                     balance_transaction=message.get('balance_transaction'),
                     community=community_key)
        entity.put()
