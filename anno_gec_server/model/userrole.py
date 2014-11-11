'''
UserRole data store model definition.
'''

from google.appengine.ext import ndb

from model.user import User
from model.community import Community
from helper.utils_enum import UserRoleType

class UserRole(ndb.Model):
    created = ndb.DateTimeProperty(auto_now_add=True)
    user = ndb.KeyProperty(kind=User, required=True)
    community = ndb.KeyProperty(kind=Community, required=True)
    role = ndb.StringProperty(choices=[UserRoleType.MEMBER,
                                       UserRoleType.MANAGER,
                                       UserRoleType.ADMIN],
                              required=True)
    circle_level = ndb.IntegerProperty(required=True, default=0)
    
    @classmethod
    def insert(cls, user, community, role=None, circle_level=0):
        entity = None
        role = role or UserRoleType.MEMBER

        if user and community:
            entity = cls(user=user.key, community=community.key, role=role, circle_level=circle_level)
            entity.put()

        return entity

    @classmethod
    def delete(cls, user, community):
        if user and community:
            entity = cls.query(ndb.AND(cls.user == user.key, cls.community == community.key)).get()
            if entity:
                entity.key.delete()

    @classmethod
    def edit(cls, user, community, role):
        entity = None
        if user and community:
            entity = cls.query(ndb.AND(cls.user == user.key, cls.community == community.key)).get()
            if entity:
                entity.role = role
                entity.put()
        return entity

    @classmethod
    def community_user_list(cls, community_id, only_managers=False):
        query = cls.query().filter(cls.community == Community.get_by_id(community_id).key)

        if only_managers:
            query = query.filter(cls.role == UserRoleType.MANAGER)

        users = query.fetch()
        return users

    @classmethod
    def getCircleLevel(cls, user, community):
        entity = cls.query(ndb.AND(cls.user == user.key, cls.community == community.key)).get()
        return entity.circle_level
