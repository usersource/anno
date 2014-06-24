__author__ = "rekenerd"

"""
Invite data store model definition.
"""

from google.appengine.ext import ndb

from model.base_model import BaseModel
from model.community import Community
from api.utils import get_invite_mail_content

class Invite(BaseModel):
    name = ndb.StringProperty()
    email = ndb.StringProperty(required=True)
    role = ndb.StringProperty(choices=["member", "manager"], required=True, default="member")
    invite_msg = ndb.StringProperty()
    community = ndb.KeyProperty(kind=Community, required=True)

    @classmethod
    def create(cls, message):
        invite_mail_text = ""
        community = Community.get_by_id(message.community)

        if community:
            if message.role is None:
                message.role = "member"

            if message.invite_msg is None:
                message.invite_msg = community.welcome_msg

            entity = cls(name=message.name, email=message.email, role=message.role,
                         invite_msg=message.invite_msg, community=community.key)
            entity.put()

            if entity:
                invite_mail_text = get_invite_mail_content(user_name=message.name,
                                                           user_email=message.email,
                                                           role=message.role,
                                                           invite_msg=message.invite_msg,
                                                           community_name=community.name,
                                                           invite_hash=entity.key)

        return invite_mail_text
