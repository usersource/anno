__author__ = 'topcircler'

from google.appengine.ext import ndb

from model.anno import Anno
from model.base_model import BaseModel
from message.followup_message import FollowupMessage
from message.user_message import UserMessage


class FollowUp(BaseModel):
    """
    Follow up data model.
    """
    comment = ndb.StringProperty()
    anno_key = ndb.KeyProperty(kind=Anno)
    last_modified = ndb.DateTimeProperty(auto_now_add=True)

    def to_message(self):
        """
        Convert FollowUp data model to follow up message.
        """
        message = FollowupMessage()
        message.id = self.key.id()
        message.anno_id = self.anno_key.id()
        message.comment = self.comment
        message.created = self.created
        if self.creator is not None:
            message.creator = self.creator.get().to_message()
        return message

    @classmethod
    def find_by_anno(cls, anno):
        followups = []
        for followup in FollowUp.query(FollowUp.anno_key == anno.key):
            followups.append(followup)
        return followups

    @classmethod
    def query_followup_by_author(cls, user):
        query = cls.query(cls.creator == user.key).order(-cls.created)
        followup_list = []
        for followup in query:
            followup_list.append(followup)
        return followup_list