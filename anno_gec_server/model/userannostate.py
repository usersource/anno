__author__ = "rekenerd"

import datetime

from google.appengine.ext import ndb

from model.user import User
from model.anno import Anno

class UserAnnoState(ndb.Model):
    user = ndb.KeyProperty(kind=User, required=True)
    anno = ndb.KeyProperty(kind=Anno, required=True)
    last_read = ndb.DateTimeProperty()
    created = ndb.DateTimeProperty(auto_now_add=True)
    modified = ndb.DateTimeProperty()
    notify = ndb.BooleanProperty(default=True)

    @classmethod
    def get(cls, user, anno):
        return cls.query(ndb.AND(cls.user == user.key, cls.anno == anno.key)).get()

    @classmethod
    def insert(cls, user, anno, modified=None):
        entity = cls.get(user=user, anno=anno)
        entity_modified = modified or datetime.datetime.now()

        if not entity:
            entity = cls(user=user.key, anno=anno.key, modified=entity_modified)
        else:
            entity.modified = entity_modified

        entity.put()
        return entity

    @classmethod
    def list_by_anno(cls, anno_id):
        anno = Anno.get_by_id(anno_id)
        query = cls.query(ndb.AND(cls.anno == anno.key, cls.notify == True))
        return query.fetch(projection=[cls.user, cls.last_read])

    @classmethod
    def list_by_user(cls, user_key):
        return cls.query(cls.user == user_key).order(-cls.modified).fetch(projection=[cls.anno])

    @classmethod
    def delete_by_anno(cls, anno_id=None, anno_key=None):
        if anno_key is None:
            anno = Anno.get_by_id(anno_id) if anno_id else None
            anno_key = anno.key if anno else None

        if anno_key:
            userannostates = cls.query(cls.anno == anno_key).fetch()
            userannostate_key_list = [ userannostate.key for userannostate in userannostates ]
            ndb.delete_multi(userannostate_key_list)

    @classmethod
    def update_last_read(cls, user, anno, last_read):
        entity = cls.get(user=user, anno=anno)

        if entity:
            entity.last_read = last_read
            entity.put()
