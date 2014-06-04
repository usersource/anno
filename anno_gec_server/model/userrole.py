__author__ = "rekenerd"

'''
UserRole data store model definition.
'''

from google.appengine.ext import ndb

from model.user import User
from model.community import Community

class UserRole(ndb.Model):
    created = ndb.DateTimeProperty(auto_now_add=True)
    user = ndb.KeyProperty(kind=User, required=True)
    community = ndb.KeyProperty(kind=Community, required=True)
    role = ndb.StringProperty(choices=["member", "manager"], required=True)
    
    @classmethod
    def insert(cls, user, community, role):
        if user.id:
            user = User.get_by_id(user.id)
        elif user.user_email:
            user = User.find_user_by_email(user.user_email)

        if user:
            entity = cls(user=user.key, community=community.key, role=role)
            entity.put()
            return entity
        else:
            return None
