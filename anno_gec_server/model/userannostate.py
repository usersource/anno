__author__ = "rekenerd"

from google.appengine.ext import ndb

from model.user import User
from model.anno import Anno

class UserAnnoState(ndb.Model):
    user = ndb.KeyProperty(kind=User)
    anno = ndb.KeyProperty(kind=Anno)
    last_action_type = ndb.StringProperty(choices=["create", "vote", "followup", "flag"])
    last_read = ndb.DateTimeProperty()
    created = ndb.DateTimeProperty(auto_now_add=True)
    notify = ndb.BooleanProperty(default=True)

    @classmethod
    def get(cls, user, anno):
        return cls.query(ndb.AND(cls.user == user.key, cls.anno == anno.key)).get()

    @classmethod
    def insert(cls, user, anno, action_type):
        entity = cls.get(user=user, anno=anno)

        if entity:
            entity.last_action_type = action_type
        else:
            entity = cls(user=user.key, anno=anno.key, last_action_type=action_type)

        entity.put()
