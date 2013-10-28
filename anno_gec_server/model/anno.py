__author__ = 'topcircler'

"""
Anno data store model definition.
"""

import endpoints
from google.appengine.ext import ndb

from anno_api_messages import AnnoMessage
from anno_api_messages import AnnoResponseMessage

package = 'core'


def get_endpoints_current_user(raise_unauthorized=True):
    """Returns a current user and (optionally) causes an HTTP 401 if no user.

    Args:
        raise_unauthorized: Boolean; defaults to True. If True, this method
            raises an exception which causes an HTTP 401 Unauthorized to be
            returned with the request.

    Returns:
        The signed in user if there is one, else None if there is no signed in
        user and raise_unauthorized is False.
    """
    current_user = endpoints.get_current_user()
    if raise_unauthorized and current_user is None:
        raise endpoints.UnauthorizedException('Invalid token.')
    return current_user


class Anno(ndb.Model):
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
    creator = ndb.UserProperty()

    def to_response_message(self):
        """
        Convert anno model to AnnoResponseMessage.
        """
        # todo: add user.
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
                                   create_time=self.create_time)

    def to_response_message_by_projection(self, projection):
        """
        convert anno model to AnnoResponseMessage by projection.
        """
        anno_resp_message = AnnoResponseMessage(id=self.key.id())
        for prop_name in projection:
            anno_resp_message.__setattr__(prop_name, getattr(self, prop_name))
        return anno_resp_message

    @classmethod
    def put_from_message(cls, message):
        """
        create a new anno model from request message.
        """
        # todo: user
        #current_user = get_endpoints_current_user()
        # TODO: image.
        entity = cls(anno_text=message.anno_text, x=message.x, y=message.y, anno_type=message.anno_type,
                     is_circle_on_top=message.is_circle_on_top, is_moved=message.is_moved, level=message.level,
                     model=message.model, app_name=message.app_name, app_version=message.app_version,
                     os_name=message.os_name, os_version=message.os_version)
        entity.put()
        return entity

    def merge_from_message(self, message):
        """
        populate current anno with non-null fields in request message.(used in merge)
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
