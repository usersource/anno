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
    
    memberRole = "member"

    @classmethod
    def insert(cls, user, community, role=None):
        entity = None

        if role is None:
            role = cls.memberRole

        if type(community) is not Community:
            community = Community.get_by_id(community.id) if community.id else None

        if user.id:
            user = User.get_by_id(user.id)
        elif user.user_email:
            user = User.find_user_by_email(user.user_email)

        if user and community:
            entity = cls(user=user.key, community=community.key, role=role)
            entity.put()

        return entity

    @classmethod
    def delete(cls, user, community):
        entity = None
        if user and community:
            entity = cls.query(ndb.AND(cls.user == user.key, cls.community == community.key).get())
        if entity:
            entity.key.delete()

    @classmethod
    def community_user_list(cls, community_id):
        users = cls.query().filter(cls.community == Community.get_by_id(community_id).key)\
                                .fetch(projection=[cls.user, cls.role])

        return users
