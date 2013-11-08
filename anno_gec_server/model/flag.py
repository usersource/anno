__author__ = 'topcircler'

from google.appengine.ext import ndb

from model.anno import Anno
from model.base_model import BaseModel
from message.flag_message import FlagMessage


class Flag(BaseModel):
    """
    Flag data model.
    """
    anno_key = ndb.KeyProperty(kind=Anno)

    def to_message(self):
        """
        Convert Flag data model to flag message.
        """
        message = FlagMessage()
        message.id = self.key.id()
        message.anno_id = self.anno_key.id()
        message.user_id = self.creator.id()
        return message

    @classmethod
    def is_belongs_user(cls, anno, user):
        return Flag.query(Flag.anno_key == anno.key, Flag.creator == user.key).get() is not None