__author__ = 'topcircler'


from google.appengine.ext import ndb

from model.anno import Anno
from model.base_model import BaseModel
from message.followup_message import FollowupMessage


class FollowUp(BaseModel):
    """
    Follow up data model.
    """
    comment = ndb.StringProperty()
    anno_key = ndb.KeyProperty(kind=Anno)

    def to_message(self):
        """
        Convert FollowUp data model to follow up message.
        """
        message = FollowupMessage()
        message.id = self.key.id()
        message.anno_id = self.anno_key.id()
        message.user_id = self.creator.id()
        message.comment = self.comment
        message.created = self.created
        return message

    @classmethod
    def find_by_anno(cls, anno):
        followups = []
        for followup in FollowUp.query(FollowUp.anno_key == anno.key):
            followups.append(followup)
        return followups