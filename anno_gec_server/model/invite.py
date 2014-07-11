__author__ = "rekenerd"

"""
Invite data store model definition.
"""

import uuid

from google.appengine.ext import ndb

from model.base_model import BaseModel
from model.community import Community
from model.user import User
from model.userrole import UserRole
from helper.utils_enum import UserRoleType

class Invite(BaseModel):
    name = ndb.StringProperty()
    email = ndb.StringProperty(required=True)
    role = ndb.StringProperty(choices=[UserRoleType.MEMBER, UserRoleType.MANAGER], 
                              required=True, default=UserRoleType.MEMBER)
    invite_msg = ndb.TextProperty()
    invite_hash = ndb.StringProperty(required=True)
    community = ndb.KeyProperty(kind=Community, required=True)

    @classmethod
    def create(cls, message):
        community_name = ""
        community = Community.get_by_id(message.community)
        invitation_created = cls.query(ndb.AND(cls.email == message.email,
                                               cls.community == community.key)
                                       ).count()

        if community and not invitation_created:
            if message.role is None:
                message.role = UserRoleType.MEMBER

            if message.invite_msg is None:
                message.invite_msg = community.welcome_msg

            invite_hash = str(uuid.uuid4())
            entity = cls(name=message.name, email=message.email, role=message.role,
                         invite_msg=message.invite_msg, invite_hash=invite_hash,
                         community=community.key)
            entity.put()

            if entity:
                community_name = community.name

        return community_name


    @classmethod
    def delete(cls, user_email, community):
        query = cls.query(ndb.AND(cls.email == user_email, cls.community == community.key))
        invited_user = query.get()

        if invited_user:
            invited_user.key.delete()


    @classmethod
    def change_user_role(cls, user_email, community, role):
        query = cls.query(ndb.AND(cls.email == user_email, cls.community == community.key))
        invited_user = query.get()

        if invited_user:
            invited_user.role = role
            invited_user.put()

        return invited_user


    @classmethod
    def list_by_user(cls, user_email):
        return cls.query(cls.email == user_email).fetch()

    @classmethod
    def list_by_community(cls, community_id):
        return cls.query(cls.community == Community.get_by_id(community_id).key).fetch()

    @classmethod
    def accept(cls, message):
        resp = None
        msg = ""
        invitation = cls.query(cls.invite_hash == message.invite_hash).get()

        if invitation:
            community = invitation.community.get()
            if community:
                if (invitation.email == message.user_email) or message.force:
                    user = User.find_user_by_email(message.user_email)
                    resp = UserRole.insert(user, community, invitation.role)
                    if resp:
                        invitation.key.delete()
                        msg = "Invitation accepted"
                    else:
                        msg = "Error while adding user to community"
                else:
                    msg = "User Mismatch"
            else:
                msg = "Community no longer exist"
        else:
            msg = "Invitation no longer exist"

        return (resp, msg)
