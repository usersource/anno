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
    role = ndb.StringProperty(choices=["member", "manager"], required=True, default="member")
    
    @classmethod
    def insert(cls, user, community, role):
        cls(user=user, community=community, role=role).put()
