__author__ = "rekenerd"

from google.appengine.ext import ndb

from model.user import User
from model.anno import Anno

class UserAnnoState(ndb.Model):
    user = ndb.KeyProperty(kind=User, required=True)
    anno = ndb.KeyProperty(kind=Anno, required=True)
    last_read = ndb.DateTimeProperty()
    created = ndb.DateTimeProperty(auto_now_add=True)
    notify = ndb.BooleanProperty(default=True)

    @classmethod
    def get(cls, user, anno):
        return cls.query(ndb.AND(cls.user == user.key, cls.anno == anno.key)).get()

    @classmethod
    def insert(cls, user, anno):
        entity = cls.get(user=user, anno=anno)

        if not entity:
            entity = cls(user=user.key, anno=anno.key)
            entity.put()

    @classmethod
    def list_by_anno(cls, anno_id):
        anno = Anno.get_by_id(anno_id)
        query = cls.query(ndb.AND(cls.anno == anno, cls.notify == True))
        return query.fetch(projection=[cls.user, cls.last_read])

    @classmethod
    def update_last_read(cls, user, anno, last_read):
        entity = cls.get(user=user, anno=anno)

        if entity:
            entity.last_read = last_read
            entity.put()
