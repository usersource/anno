__author__ = 'topcircler'

"""
Anno model definition.
"""

import endpoints
from google.appengine.ext import ndb

from anno_api_messages import AnnoMessage

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
    This class representds Annotation Model(in datastore).
    """
    comment = ndb.StringProperty(required=True)
    x = ndb.FloatProperty(required=True)
    y = ndb.FloatProperty(required=True)
    image = ndb.BlobProperty()
    type = ndb.StringProperty(required=True, default='simple comment')
    is_circle_on_top = ndb.BooleanProperty(required=True)
    moved = ndb.BooleanProperty(required=True)
    level = ndb.IntegerProperty(required=True)
    model = ndb.StringProperty(required=True)
    app_name = ndb.StringProperty()
    app_version = ndb.StringProperty()
    os_name = ndb.StringProperty()
    os_version = ndb.StringProperty()
    create_time = ndb.DateTimeProperty(auto_now=True)
    creator = ndb.UserProperty()

    def to_message(self):
        """
        convert model to AnnoMessage.
        """
        return AnnoMessage(id=self.key.id(),
                           comment=self.comment,
                           x=self.x,
                           y=self.y,
                           anno_type=self.type,
                           is_circle_on_top=self.is_circle_on_top,
                           is_moved=self.moved,
                           level=self.level,
                           model=self.model,
                           app_name=self.app_name,
                           app_version=self.app_version,
                           os_name=self.os_name,
                           os_version=self.os_version,
                           create_time=self.create_time)
                           # user

    @classmethod
    def put_from_message(cls, message):
        """
        create a new anno model from request message.
        """
        current_user = get_endpoints_current_user()
        # TODO: image.
        entity = cls(comment=message.comment, x=message.x, y=message.y, type=message.anno_type,
                     is_circle_on_top=message.is_circle_on_top, moved=message.is_moved, level=message.level,
                     model=message.model, app_name=message.app_name, app_version=message.app_version,
                     os_name=message.os_name, os_version=message.os_version, creator=current_user)
        entity.put()
        return entity

    def merge_from_message(self, message):
        """
        populate current anno with non-null fields in request message.(used in merge)
        """
        if message.comment is not None:
            self.comment = message.comment
        if message.x is not None:
            self.x = message.x
        if message.y is not None:
            self.y = message.y
        if message.image is not None:
            self.image = message.image
        if message.anno_type is not None:
            self.type = message.anno_type
        if message.is_circle_on_top is not None:
            self.is_circle_on_top = message.is_circle_on_top
        if message.is_moved is not None:
            self.moved = message.is_moved
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

    def populate_from_message(self, message):
        """
        populate current anno with all fields in request message.(will use in update)
        """
        self.comment = message.comment
        self.x = message.x
        self.y = message.y
        self.image = message.image
        self.type = message.anno_type
        self.is_circle_on_top = message.is_circle_on_top
        self.moved = message.is_moved
        self.level = message.level
        self.model = message.model
        self.app_name = message.app_name
        self.app_version = message.app_version
        self.os_name = message.os_name
        self.os_version = message.os_version