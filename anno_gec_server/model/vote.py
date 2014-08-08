__author__ = 'topcircler'

from google.appengine.ext import ndb

from model.anno import Anno

from model.base_model import BaseModel
from message.vote_message import VoteMessage


class Vote(BaseModel):
    """
    Vote data model.
    """
    anno_key = ndb.KeyProperty(kind=Anno)
    last_modified = ndb.DateTimeProperty(auto_now_add=True)

    def to_message(self):
        """
        Convert Vote data model to vote message.
        """
        message = VoteMessage()
        message.id = self.key.id()
        message.anno_id = self.anno_key.id()
        message.created = self.created
        if self.creator is not None:
            message.creator = self.creator.get().to_message()
        return message

    @classmethod
    def is_belongs_user(cls, anno, user):
        return Vote.query(Vote.anno_key == anno.key, Vote.creator == user.key).get() is not None

    @classmethod
    def query_vote_by_author(cls, user):
        query = cls.query(cls.creator == user.key).order(-cls.created)
        vote_list = []
        for vote in query:
            vote_list.append(vote)
        return vote_list

    @classmethod
    def delete_by_anno(cls, anno_id=None, anno_key=None):
        if anno_key is None:
            anno = Anno.get_by_id(anno_id) if anno_id else None
            anno_key = anno.key if anno else None

        if anno_key:
            votes = cls.query(cls.anno_key == anno_key).fetch()
            vote_key_list = [ vote.key for vote in votes ]
            ndb.delete_multi(vote_key_list)
