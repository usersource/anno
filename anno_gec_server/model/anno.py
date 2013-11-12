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
    simple_x = ndb.FloatProperty(required=True)
    simple_y = ndb.FloatProperty(required=True)
    image = ndb.BlobProperty()
    anno_type = ndb.StringProperty(required=True, default='simple_comment')
    simple_circle_on_top = ndb.BooleanProperty(required=True)
    simple_is_moved = ndb.BooleanProperty(required=True)
    level = ndb.IntegerProperty(required=True)
    device_model = ndb.StringProperty(required=True)
    app_name = ndb.StringProperty()
    app_version = ndb.StringProperty()
    os_name = ndb.StringProperty()
    os_version = ndb.StringProperty()

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
                                   simple_x=self.simple_x,
                                   simple_y=self.simple_y,
                                   anno_type=self.anno_type,
                                   simple_circle_on_top=self.simple_circle_on_top,
                                   simple_is_moved=self.simple_is_moved,
                                   level=self.level,
                                   device_model=self.device_model,
                                   app_name=self.app_name,
                                   app_version=self.app_version,
                                   os_name=self.os_name,
                                   os_version=self.os_version,
                                   created=self.created,
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
        entity = cls(anno_text=message.anno_text, simple_x=message.simple_x, simple_y=message.simple_y, anno_type=message.anno_type,
                     simple_circle_on_top=message.simple_circle_on_top, simple_is_moved=message.simple_is_moved, level=message.level,
                     device_model=message.device_model, app_name=message.app_name, app_version=message.app_version,
                     os_name=message.os_name, os_version=message.os_version, creator=user.key)
        entity.image = message.image
        if message.created is not None:
            entity.created = message.created
        entity.put()
        return entity

    def merge_from_message(self, message):
        """
        populate current anno with non-null fields in request message.(used in merge)

        creator isn't update-able.
        """
        if message.anno_text is not None:
            self.anno_text = message.anno_text
        if message.simple_x is not None:
            self.simple_x = message.simple_x
        if message.simple_y is not None:
            self.simple_y = message.simple_y
        if message.image is not None:
            self.image = message.image
        if message.anno_type is not None:
            self.anno_type = message.anno_type
        if message.simple_circle_on_top is not None:
            self.simple_circle_on_top = message.simple_circle_on_top
        if message.simple_is_moved is not None:
            self.simple_is_moved = message.simple_is_moved
        if message.level is not None:
            self.level = message.level
        if message.device_model is not None:
            self.device_model = message.device_model
        if message.app_name is not None:
            self.app_name = message.app_name
        if message.app_version is not None:
            self.app_version = message.app_version
        if message.os_name is not None:
            self.os_name = message.os_name
        if message.os_version is not None:
            self.os_version = message.os_version
