__author__ = 'topcircler'

"""
Anno data store model definition.
"""

from google.appengine.ext import ndb

from message.anno_api_messages import AnnoResponseMessage
from message.user_message import UserMessage
from model.base_model import BaseModel


class Anno(BaseModel):
    """
    This class represents Annotation Model(in datastore).
    """
    anno_text = ndb.StringProperty(required=True)
    x = ndb.FloatProperty(required=True)
    y = ndb.FloatProperty(required=True)
    image = ndb.BlobProperty()
    anno_type = ndb.StringProperty(required=True, default='simple comment')
    is_circle_on_top = ndb.BooleanProperty(required=True)
    is_moved = ndb.BooleanProperty(required=True)
    level = ndb.IntegerProperty(required=True)
    model = ndb.StringProperty(required=True)
    app_name = ndb.StringProperty()
    app_version = ndb.StringProperty()
    os_name = ndb.StringProperty()
    os_version = ndb.StringProperty()
    create_time = ndb.DateTimeProperty(auto_now=True)

    def to_response_message(self):
        """
        Convert anno model to AnnoResponseMessage.
        """
        user_message = None
        if self.creator is not None:
            user_message = UserMessage()
            user_message.id = self.creator.id()
            user_message.user_id = self.creator.get().user_id
            user_message.user_email = self.creator.get().user_email
        # todo: set image.
        return AnnoResponseMessage(id=self.key.id(),
                                   anno_text=self.anno_text,
                                   x=self.x,
                                   y=self.y,
                                   anno_type=self.anno_type,
                                   is_circle_on_top=self.is_circle_on_top,
                                   is_moved=self.is_moved,
                                   level=self.level,
                                   model=self.model,
                                   app_name=self.app_name,
                                   app_version=self.app_version,
                                   os_name=self.os_name,
                                   os_version=self.os_version,
                                   create_time=self.create_time,
                                   creator=user_message)

    def to_response_message_by_projection(self, projection):
        """
        convert anno model to AnnoResponseMessage by projection.
        """
        anno_resp_message = AnnoResponseMessage(id=self.key.id())
        # todo: set image
        for prop_name in projection:
            if prop_name == 'creator':
                user_message = UserMessage()
                user_message.id = self.creator.id()
                user_message.user_id = self.creator.get().user_id
                user_message.user_email = self.creator.get().user_email
                anno_resp_message.creator = user_message
            else:
                anno_resp_message.__setattr__(prop_name, getattr(self, prop_name))
        return anno_resp_message

    @classmethod
    def insert_anno(cls, message, user):
        """
        create a new anno model from request message.
        """
        # TODO: image.
        entity = cls(anno_text=message.anno_text, x=message.x, y=message.y, anno_type=message.anno_type,
                     is_circle_on_top=message.is_circle_on_top, is_moved=message.is_moved, level=message.level,
                     model=message.model, app_name=message.app_name, app_version=message.app_version,
                     os_name=message.os_name, os_version=message.os_version, creator=user.key)
        entity.put()
        return entity

    def merge_from_message(self, message):
        """
        populate current anno with non-null fields in request message.(used in merge)

        creator isn't update-able.
        """
        if message.anno_text is not None:
            self.anno_text = message.anno_text
        if message.x is not None:
            self.x = message.x
        if message.y is not None:
            self.y = message.y
        if message.image is not None:
            self.image = message.image
        if message.anno_type is not None:
            self.anno_type = message.anno_type
        if message.is_circle_on_top is not None:
            self.is_circle_on_top = message.is_circle_on_top
        if message.is_moved is not None:
            self.is_moved = message.is_moved
        if message.level is not None:
            self.level = message.level
        if message.model is not None:
            self.model = message.model
        if message.app_name is not None:
            self.app_name = message.app_name
        if message.app_version is not None:
            self.app_version = message.app_version
        if message.os_name is not None:
            self.os_name = message.os_name
        if message.os_version is not None:
            self.os_version = message.os_version
