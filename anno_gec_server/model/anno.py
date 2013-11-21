__author__ = 'topcircler'

"""
Anno data store model definition.
"""

from google.appengine.ext import ndb
import datetime

from message.anno_api_messages import AnnoResponseMessage
from message.anno_api_messages import AnnoListMessage
from message.user_message import UserMessage
from model.base_model import BaseModel
from api.utils import get_country_by_coordinate


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
    # use TextProperty instead of StringProperty.
    # StringProperty if indexed, up to 500 characters.
    # TextProperty not indexed, no limitation.
    draw_elements = ndb.TextProperty()
    screenshot_is_anonymized = ndb.BooleanProperty()
    geo_position = ndb.StringProperty()
    flag_count = ndb.IntegerProperty(default=0)  # how many flags are there for this anno
    vote_count = ndb.IntegerProperty(default=0)  # how many votes are there for this anno
    followup_count = ndb.IntegerProperty(default=0)  # how many follow ups are there for this anno
    last_update_time = ndb.DateTimeProperty(auto_now_add=True)  # last time that vote/flag/followup creation.
    last_activity = ndb.StringProperty('anno')  # last activity, vote/flag/followup creation
    latitude = ndb.FloatProperty()
    longitude = ndb.FloatProperty()
    country = ndb.StringProperty()

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
                                   creator=user_message,
                                   draw_elements=self.draw_elements,
                                   screenshot_is_anonymized=self.screenshot_is_anonymized,
                                   latitude=self.latitude,
                                   longitude=self.longitude,
                                   country=self.country
                                   )

    def to_response_message_by_projection(self, projection):
        """
        convert anno model to AnnoResponseMessage by projection.
        """
        anno_resp_message = AnnoResponseMessage(id=self.key.id())
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
        entity = cls(anno_text=message.anno_text, simple_x=message.simple_x, simple_y=message.simple_y,
                     anno_type=message.anno_type,
                     simple_circle_on_top=message.simple_circle_on_top, simple_is_moved=message.simple_is_moved,
                     level=message.level,
                     device_model=message.device_model, app_name=message.app_name, app_version=message.app_version,
                     os_name=message.os_name, os_version=message.os_version, creator=user.key,
                     draw_elements=message.draw_elements, screenshot_is_anonymized=message.screenshot_is_anonymized,
                     geo_position=message.geo_position, flag_count=0, vote_count=0, followup_count=0,
                     last_activity='anno', latitude=message.latitude, longitude=message.longitude)
        # set image.
        entity.image = message.image
        # set created time if provided in the message.
        if message.created is not None:
            entity.created = message.created
            # use google map api to retrieve country information and save into datastore.
        entity.country = get_country_by_coordinate(message.latitude, message.longitude)
        # set last update time & activity
        entity.last_update_time = datetime.datetime.now()
        entity.last_activity = 'anno'
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
        if message.draw_elements is not None:
            self.draw_elements = message.draw_elements
        if message.screenshot_is_anonymized is not None:
            self.screenshot_is_anonymized = message.screenshot_is_anonymized
        if message.geo_position is not None:
            self.geo_position = message.geo_position
        # TODO: can't merge latitude & longitude now, if to enable it, also needs to look up country again.

    @classmethod
    def query_by_app_by_created(cls, app_name, limit, projection, curs):
        query = cls.query()
        query = query.filter(cls.app_name == app_name)
        query = query.order(-cls.created)
        if (curs is not None) and (projection is not None):
            annos, next_curs, more = query.fetch_page(limit, start_cursor=curs, projection=projection)
        elif (curs is not None) and (projection is None):
            annos, next_curs, more = query.fetch_page(limit, start_cursor=curs)
        elif (curs is None) and (projection is not None):
            annos, next_curs, more = query.fetch_page(limit, projection=projection)
        else:
            annos, next_curs, more = query.fetch_page(limit)
        if projection is not None:
            items = [entity.to_response_message_by_projection(projection) for entity in annos]
        else:
            items = [entity.to_response_message() for entity in annos]

        if more:
            return AnnoListMessage(anno_list=items, cursor=next_curs.urlsafe(), has_more=more)
        else:
            return AnnoListMessage(anno_list=items, has_more=more)

    @classmethod
    def query_by_vote_count(cls, app_name):
        query = cls.query().filter(cls.app_name == app_name).order(-cls.vote_count)
        anno_list = []
        for anno in query:
            anno_message = anno.to_response_message()
            anno_message.vote_count = anno.vote_count
            anno_list.append(anno_message)
        return AnnoListMessage(anno_list=anno_list)

    @classmethod
    def query_by_flag_count(cls, app_name):
        query = cls.query().filter(cls.app_name == app_name).filter(cls.flag_count > 0).order(-cls.flag_count)
        anno_list = []
        for anno in query:
            anno_message = anno.to_response_message()
            anno_message.flag_count = anno.flag_count
            anno_list.append(anno_message)
        return AnnoListMessage(anno_list=anno_list)

    @classmethod
    def query_by_activity_count(cls, app_name):
        anno_list = []
        for anno in cls.query().filter(cls.app_name == app_name):
            anno_list.append(anno)
        anno_list = sorted(anno_list, key=lambda x: (x.vote_count + x.flag_count + x.followup_count), reverse=True)
        anno_resp_list = []
        for anno in anno_list:
            anno_message = anno.to_response_message()
            anno_message.activity_count = anno.vote_count + anno.flag_count + anno.followup_count
            anno_resp_list.append(anno_message)
        return AnnoListMessage(anno_list=anno_resp_list)

    @classmethod
    def query_by_last_activity(cls, app_name):
        query = cls.query().filter(cls.app_name == app_name).order(-cls.last_update_time)
        anno_list = []
        for anno in query:
            anno_message = anno.to_response_message()
            anno_message.last_update_time = anno.last_update_time
            anno_message.last_activity = anno.last_activity
            anno_list.append(anno_message)
        return AnnoListMessage(anno_list=anno_list)

    @classmethod
    def query_by_country(cls, app_name):
        """
        Query annos for a given app by country alphabetical order.
        No pagination is supported here.
        """
        query = cls.query().filter(cls.app_name == app_name).order(cls.country)
        anno_list = []
        for anno in query:
            anno_message = anno.to_response_message()
            anno_list.append(anno_message)
        return AnnoListMessage(anno_list=anno_list)

    @classmethod
    def query_by_page(cls, limit, projection, curs):
        query = cls.query()
        if (curs is not None) and (projection is not None):
            annos, next_curs, more = query.fetch_page(limit, start_cursor=curs, projection=projection)
        elif (curs is not None) and (projection is None):
            annos, next_curs, more = query.fetch_page(limit, start_cursor=curs)
        elif (curs is None) and (projection is not None):
            annos, next_curs, more = query.fetch_page(limit, projection=projection)
        else:
            annos, next_curs, more = query.fetch_page(limit)
        if projection is not None:
            items = [entity.to_response_message_by_projection(projection) for entity in annos]
        else:
            items = [entity.to_response_message() for entity in annos]

        if more:
            return AnnoListMessage(anno_list=items, cursor=next_curs.urlsafe(), has_more=more)
        else:
            return AnnoListMessage(anno_list=items, has_more=more)
