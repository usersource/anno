__author__ = 'topcircler'

from google.appengine.api import search
from google.appengine.ext import ndb

from model.anno import Anno
from model.user import User
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
    tagged_users = ndb.StringProperty(repeated=True)

    def to_message(self, team_key=None):
        """
        Convert FollowUp data model to follow up message.
        """
        message = FollowupMessage()
        message.id = self.key.id()
        message.anno_id = self.anno_key.id()
        message.comment = self.comment
        message.created = self.created

        message.tagged_users_detail = []
        for user in self.tagged_users:
            user_info = User.find_user_by_email(user, team_key)
            message.tagged_users_detail.append(UserMessage(display_name=user_info.display_name, user_email=user_info.user_email))

        if self.creator is not None:
            user_info = self.creator.get()
            message.creator = UserMessage(display_name=user_info.display_name, image_url=user_info.image_url)

        return message


    @classmethod
    def find_by_anno(cls, anno):
        return cls.query(cls.anno_key == anno.key).order(cls.last_modified).fetch()


    @classmethod
    def delete_by_anno(cls, anno_id=None, anno_key=None):
        if anno_key is None:
            anno = Anno.get_by_id(anno_id) if anno_id else None
            anno_key = anno.key if anno else None

        if anno_key:
            followups = cls.query(cls.anno_key == anno_key).fetch()
            followup_key_list = [ followup.key for followup in followups ]
            ndb.delete_multi(followup_key_list)


    @classmethod
    def query_followup_by_author(cls, user):
        query = cls.query(cls.creator == user.key).order(-cls.created)
        followup_list = []
        for followup in query:
            followup_list.append(followup)
        return followup_list


    def generate_search_document(self):
        followup_document = search.Document(
            doc_id=str(self.key.id()),
            fields=[
                    search.TextField(name="comment", value=self.comment),
                    search.DateField(name="created", value=self.created),
                    search.TextField(name="anno", value=str(self.anno_key.id()))
                ]
        )

        return followup_document
