__author__ = "rekenerd"

"""
Invite data store model definition.
"""

import uuid

from google.appengine.ext import ndb

from model.base_model import BaseModel
from model.community import Community
from api.utils import get_invite_mail_content

class Invite(BaseModel):
    name = ndb.StringProperty()
    email = ndb.StringProperty(required=True)
    role = ndb.StringProperty(choices=["member", "manager"], required=True, default="member")
    invite_msg = ndb.StringProperty()
    invite_hash = ndb.StringProperty(required=True)
    community = ndb.KeyProperty(kind=Community, required=True)

    @classmethod
    def create(cls, message):
        recipients = []
        subject = ""
        email_message = ""
        community = Community.get_by_id(message.community)

        if community:
            if message.role is None:
                message.role = "member"

            if message.invite_msg is None:
                message.invite_msg = community.welcome_msg

            invite_hash = str(uuid.uuid4())
            entity = cls(name=message.name, email=message.email, role=message.role,
                         invite_msg=message.invite_msg, invite_hash=invite_hash, 
                         community=community.key)
            entity.put()

            if entity:
                recipients, subject, email_message = get_invite_mail_content(user_name=message.name,
                                                                             user_email=message.email,
                                                                             role=message.role,
                                                                             invite_msg=message.invite_msg,
                                                                             invite_hash=invite_hash,
                                                                             community_name=community.name)

        return (recipients, subject, email_message)

    @classmethod
    def get_pending_invites(cls, user_email):
        return cls.query(cls.email == user_email).fetch()
