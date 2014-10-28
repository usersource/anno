"""
Anno data store model definition.
"""

import datetime
import logging

from google.appengine.api import search
from google.appengine.ext import ndb

from message.anno_api_messages import AnnoResponseMessage
from message.anno_api_messages import AnnoListMessage
from message.user_message import UserMessage
from model.base_model import BaseModel
from model.community import Community
from model.appinfo import AppInfo
from model.userrole import UserRole
from helper.utils import *
from helper.utils_enum import SearchIndexName


class Anno(BaseModel):
    """
    This class represents Annotation Model(in datastore).
    """
    anno_id = ndb.IntegerProperty()
    anno_text = ndb.StringProperty(required=True)
#     simple_x = ndb.FloatProperty(required=True)
#     simple_y = ndb.FloatProperty(required=True)
    image = ndb.BlobProperty()
    anno_type = ndb.StringProperty(required=True, default='simple_comment')
#     simple_circle_on_top = ndb.BooleanProperty(required=True)
#     simple_is_moved = ndb.BooleanProperty(required=True)
    level = ndb.IntegerProperty(required=True)
    device_model = ndb.StringProperty(required=True)
    app_name = ndb.StringProperty()
    app_version = ndb.StringProperty()
    os_name = ndb.StringProperty()
    os_version = ndb.StringProperty()
    app = ndb.KeyProperty(kind=AppInfo)
    community = ndb.KeyProperty(kind=Community, default=None)
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
    last_update_type = ndb.StringProperty(default='create')  # create/edit
    latitude = ndb.FloatProperty()
    longitude = ndb.FloatProperty()
    country = ndb.StringProperty()
    circle_level = ndb.IntegerProperty(default=0)

    def __eq__(self, other):
        return self.key.id() == other.key.id()

    def __hash__(self):
        return hash(self.key.id())

    def to_response_message(self, user, list_message=True):
        """
        Convert anno model to AnnoResponseMessage.
        """
        user_message = None
        if self.creator is not None:
            user_info = self.creator.get()
            user_message = UserMessage(display_name=user_info.display_name,
                                       image_url=user_info.image_url)

        app = self.app.get() if self.app else None
        app_name = app.name if app else self.app_name
        app_icon_url = app.icon_url if app else None
        app_version = app.version if app else self.app_version

        if list_message:
            anno_read_status = False
            if user:
                from model.userannostate import UserAnnoState
                anno_read_status = UserAnnoState.is_read(user, self)

            anno_message = AnnoResponseMessage(id=self.key.id(), anno_text=self.anno_text,
                                               anno_type=self.anno_type, app_name=app_name,
                                               app_icon_url=app_icon_url, created=self.created,
                                               creator=user_message, last_update_time=self.last_update_time,
                                               last_activity=self.last_activity, last_update_type=self.last_update_type,
                                               anno_read_status=anno_read_status
                                            )
        else:
            anno_message = AnnoResponseMessage(id=self.key.id(),
                                   anno_text=self.anno_text,
                                   anno_type=self.anno_type,
                                   level=self.level,
                                   device_model=self.device_model,
                                   app_name=app_name,
                                   app_version=app_version,
                                   app_icon_url=app_icon_url,
                                   os_name=self.os_name,
                                   os_version=self.os_version,
                                   created=self.created,
                                   creator=user_message,
                                   draw_elements=self.draw_elements,
                                   screenshot_is_anonymized=self.screenshot_is_anonymized,
                                   vote_count=self.vote_count,
                                   flag_count=self.flag_count,
                                   followup_count=self.followup_count,
                                   last_update_time=self.last_update_time,
                                   last_activity=self.last_activity,
                                   last_update_type=self.last_update_type,
        )

        return anno_message

    def to_response_message_by_projection(self, projection):
        """
        convert anno model to AnnoResponseMessage by projection.
        """
        anno_resp_message = AnnoResponseMessage(id=self.key.id())
        for prop_name in projection:
            if prop_name == 'creator':
                anno_resp_message.creator = self.creator.get().to_message()
            else:
                anno_resp_message.__setattr__(prop_name, getattr(self, prop_name))
        return anno_resp_message

    @classmethod
    def insert_anno(cls, message, user):
        """
        create a new anno model from request message.
        """
        appinfo, community = getAppAndCommunity(message, user)

        circle_level = 0
        if community:
            userrole_circle_level = UserRole.getCircleLevel(user, community)
            circle_level = message.circle_level if (message.circle_level <= userrole_circle_level) else userrole_circle_level

        entity = cls(anno_text=message.anno_text, anno_type=message.anno_type,
                     level=message.level, device_model=message.device_model, 
                     os_name=message.os_name, os_version=message.os_version, 
                     creator=user.key, draw_elements=message.draw_elements, 
                     image=message.image, screenshot_is_anonymized=message.screenshot_is_anonymized,
                     geo_position=message.geo_position, flag_count=0, vote_count=0,
                     followup_count=0, latitude=message.latitude, longitude=message.longitude)

        # set appinfo and community
        entity.app = appinfo.key
        entity.community = community.key if community else None
        entity.circle_level = circle_level

        # set created time if provided in the message.
        if message.created is not None:
            entity.created = message.created

        # use google map api to retrieve country information and save into datastore.
        if message.latitude is not None and message.longitude is not None:
            entity.country = get_country_by_coordinate(message.latitude, message.longitude)

        # set last update time & activity
        entity.last_update_time = datetime.datetime.now()
        entity.last_activity = 'UserSource'
        entity.last_update_type = 'create'
        anno_key = entity.put()

        entity.anno_id = anno_key.id()
        entity.put()

        # update user anno state
        from model.userannostate import UserAnnoState
        UserAnnoState.insert(user=user, anno=entity)

        return entity


    @classmethod
    def delete(cls, anno):
        anno_id = "%d" % anno.key.id()

        # deleting UserAnnoState of anno
        from model.userannostate import UserAnnoState
        UserAnnoState.delete_by_anno(anno_key=anno.key)

        # deleting FollowUp of anno
        from model.follow_up import FollowUp
        FollowUp.delete_by_anno(anno_key=anno.key)

        # deleting Vote of anno
        from model.vote import Vote
        Vote.delete_by_anno(anno_key=anno.key)

        # deleting Flag of anno
        from model.flag import Flag
        Flag.delete_by_anno(anno_key=anno.key)

        anno.key.delete()
        index = search.Index(name=SearchIndexName.ANNO)
        index.delete(anno_id)


    def merge_from_message(self, message, user):
        """
        populate current anno with non-null fields in request message.(used in merge)

        creator isn't update-able.
        """
        appinfo, community = getAppAndCommunity(message, user)

        # set appinfo and community
        self.app = appinfo.key
        self.community = community.key if community else None

        if message.anno_text is not None:
            self.anno_text = message.anno_text
#         if message.simple_x is not None:
#             self.simple_x = message.simple_x
#         if message.simple_y is not None:
#             self.simple_y = message.simple_y
        if message.image is not None:
            self.image = message.image
        if message.anno_type is not None:
            self.anno_type = message.anno_type
#         if message.simple_circle_on_top is not None:
#             self.simple_circle_on_top = message.simple_circle_on_top
#         if message.simple_is_moved is not None:
#             self.simple_is_moved = message.simple_is_moved
        if message.level is not None:
            self.level = message.level
        if message.device_model is not None:
            self.device_model = message.device_model
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
    def query_by_app_by_created(cls, app_name, limit, projection, curs, user):
        query = cls.query()
        query = query.filter(cls.app_name == app_name)
        query = query.order(-cls.created)
        query = filter_anno_by_user(query, user)

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
            items = [entity.to_response_message(user) for entity in annos]

        if more:
            return AnnoListMessage(anno_list=items, cursor=next_curs.urlsafe(), has_more=more)
        else:
            return AnnoListMessage(anno_list=items, has_more=more)

    @classmethod
    def query_by_vote_count(cls, app_name, user):
        query = cls.query()
        query = query.filter(cls.app_name == app_name).order(-cls.vote_count)
        query = filter_anno_by_user(query, user)

        anno_list = []
        for anno in query:
            anno_message = anno.to_response_message(user)
            anno_message.vote_count = anno.vote_count
            anno_list.append(anno_message)
        return AnnoListMessage(anno_list=anno_list)

    @classmethod
    def query_by_flag_count(cls, app_name, user):
        query = cls.query()
        query = query.filter(cls.app_name == app_name).filter(cls.flag_count > 0).order(-cls.flag_count)
        query = filter_anno_by_user(query, user)

        anno_list = []
        for anno in query:
            anno_message = anno.to_response_message(user)
            anno_message.flag_count = anno.flag_count
            anno_list.append(anno_message)
        return AnnoListMessage(anno_list=anno_list)

    @classmethod
    def query_by_activity_count(cls, app_name, user):
        query = cls.query()
        query = query.filter(cls.app_name == app_name)
        query = filter_anno_by_user(query, user)

        anno_list = []
        for anno in query:
            anno_list.append(anno)
        anno_list = sorted(anno_list, key=lambda x: (x.vote_count + x.flag_count + x.followup_count), reverse=True)
        anno_resp_list = []
        for anno in anno_list:
            anno_message = anno.to_response_message()
            anno_message.activity_count = anno.vote_count + anno.flag_count + anno.followup_count
            anno_resp_list.append(anno_message)
        return AnnoListMessage(anno_list=anno_resp_list)

    @classmethod
    def query_by_last_activity(cls, app_name, user):
        query = cls.query()
        query = query.filter(cls.app_name == app_name).order(-cls.last_update_time)
        query = filter_anno_by_user(query, user)

        anno_list = []
        for anno in query:
            anno_message = anno.to_response_message(user)
            anno_message.last_update_time = anno.last_update_time
            anno_message.last_activity = anno.last_activity
            anno_list.append(anno_message)
        return AnnoListMessage(anno_list=anno_list)

    @classmethod
    def query_by_country(cls, app_name, user):
        """
        Query annos for a given app by country alphabetical order.
        No pagination is supported here.
        """
        query = cls.query()
        query = query.filter(cls.app_name == app_name).order(cls.country)
        query = filter_anno_by_user(query, user)

        anno_list = []
        for anno in query:
            anno_message = anno.to_response_message()
            anno_list.append(anno_message)
        return AnnoListMessage(anno_list=anno_list)

    @classmethod
    def query_by_page(cls, limit, projection, curs, user, is_plugin=False):
        query = cls.query()
        query = query.order(-cls.created)
        query = filter_anno_by_user(query, user, is_plugin)

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
            items = [entity.to_response_message(user) for entity in annos]

        if more:
            return AnnoListMessage(anno_list=items, cursor=next_curs.urlsafe(), has_more=more)
        else:
            return AnnoListMessage(anno_list=items, has_more=more)

    @classmethod
    def query_by_community(cls, community, limit, projection, curs, user):
        if community:
            query = cls.query(cls.community == community.key)
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
                items = [entity.to_response_message(user) for entity in annos]
    
            if more:
                return AnnoListMessage(anno_list=items, cursor=next_curs.urlsafe(), has_more=more)
            else:
                return AnnoListMessage(anno_list=items, has_more=more)
        else:
            return AnnoListMessage(anno_list=[])

    @classmethod
    def query_by_app(cls, app, limit, projection, curs, user):
        if app:
            query = cls.query(cls.app == app.key)
            query = query.order(-cls.created)
            query = filter_anno_by_user(query, user)

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
                items = [entity.to_response_message(user) for entity in annos]

            if more:
                return AnnoListMessage(anno_list=items, cursor=next_curs.urlsafe(), has_more=more)
            else:
                return AnnoListMessage(anno_list=items, has_more=more)
        else:
            return AnnoListMessage(anno_list=[])

    @classmethod
    def is_anno_exists(cls, user, message):
        query = cls.query() \
            .filter(cls.app_name == message.app_name) \
            .filter(cls.anno_text == message.anno_text) \
            .filter(cls.anno_type == message.anno_type) \
            .filter(cls.level == message.level) \
            .filter(cls.os_name == message.os_name) \
            .filter(cls.os_version == message.os_version) \
            .filter(cls.device_model == message.device_model) \
            .filter(cls.screenshot_is_anonymized == message.screenshot_is_anonymized) \
            .filter(cls.created == message.created)
#             .filter(cls.simple_circle_on_top == message.simple_circle_on_top) \
#             .filter(cls.simple_x == message.simple_x) \
#             .filter(cls.simple_y == message.simple_y) \
#             .filter(cls.simple_is_moved == message.simple_is_moved)
        for anno in query:
            if anno.creator.id() == user.key.id():
                return anno
        return None

    @classmethod
    def query_my_anno(cls, limit, curs, user):
        if user:
            from model.userannostate import UserAnnoState
            userannostate_list = UserAnnoState.list_by_user(user_key=user.key)
            anno_id_list = [ userannostate.anno.id() for userannostate in userannostate_list ]

            anno_message_list = []
            more = False
            if len(anno_id_list):
                query = cls.query(cls.anno_id.IN(anno_id_list)).order(-cls.last_update_time, cls.key)
                anno_list, next_curs, more = query.fetch_page(limit, start_cursor=curs)
                anno_message_list = [ anno.to_response_message(user) for anno in anno_list if anno is not None ]

            if more:
                return AnnoListMessage(anno_list=anno_message_list, cursor=next_curs.urlsafe(), has_more=more)
            else:
                return AnnoListMessage(anno_list=anno_message_list, has_more=more)
        else:
            return AnnoListMessage(anno_list=[])

    @classmethod
    def query_by_followup(cls, search_string, query_string):
        followup_index = search.Index(name=SearchIndexName.FOLLOWUP)
        followup_query_string = "( comment = (~%s) )" % search_string
        query_options = search.QueryOptions(returned_fields=["anno"])
        query = search.Query(query_string=followup_query_string, options=query_options)
        results = followup_index.search(query)
        followup_list = [ str(result.fields[0].value) for result in results ]

        if len(followup_list):
            followup_list_string = "( anno_id = (%s) )" % " OR ".join(followup_list)
            query_string = query_string + " OR " + followup_list_string if len(query_string) else followup_list_string

        return query_string

    @classmethod
    def query_by_recent(cls, limit, offset, search_string, app_name, app_set, user):
        """
        This method queries anno records by 'recent' order.
        'recent' = created
        :param limit how many anno records to query.
        :param offset query offset which represents starting from which anno record.
        :param search_string search string which partial-matches to anno_text.
        :param app_name app name which full-matches to app_name, this parameter is a single app name, not an app list.
        :param app_set app name set.
        """
        index = search.Index(name=SearchIndexName.ANNO)
        # prepare pagination
        if limit is None:
            limit = 20  # default page size is 20.
        if offset is None:
            offset = 0
        # build query string
        query_string = Anno.get_query_string(search_string, app_name, app_set)
        if not is_empty_string(search_string):
            query_string = Anno.query_by_followup(search_string, query_string)
        # build query options
        sort = search.SortExpression(expression="created",
                                     direction=search.SortExpression.DESCENDING,
                                     default_value=datetime.datetime.now())
        sort_opts = search.SortOptions(expressions=[sort])
        query_options = search.QueryOptions(
            limit=limit,
            offset=offset,
            sort_options=sort_opts,
            returned_fields=['anno_text', 'app_name', 'created', 'community']
        )
        # execute query
        return Anno.convert_document_to_message(index, query_string, query_options, offset, limit, user)

    @classmethod
    def query_by_popular(cls, limit, offset, search_string, app_name, app_set, user):
        """
        This method queries anno records by 'popular' order.
        'popular' = vote_count - flag_count
        :param limit how many anno records to query.
        :param offset query offset which represents starting from which anno record.
        :param search_string search string which partial-matches to anno_text.
        :param app_name app name which full-matches to app_name, this parameter is a single app name, not an app list.
        :param app_set app name set.
        """
        index = search.Index(name=SearchIndexName.ANNO)
        # prepare pagination
        if limit is None:
            limit = 20  # default page size is 20.
        if offset is None:
            offset = 0
        # build query string
        query_string = Anno.get_query_string(search_string, app_name, app_set)
        if not is_empty_string(search_string):
            query_string = Anno.query_by_followup(search_string, query_string)
        # build query options
        sort = search.SortExpression(expression="vote_count-flag_count",
                                     direction=search.SortExpression.DESCENDING, default_value=0)
        sort_opts = search.SortOptions(expressions=[sort])
        query_options = search.QueryOptions(
            limit=limit,
            offset=offset,
            sort_options=sort_opts,
            returned_fields=['anno_text', 'app_name', 'vote_count', 'flag_count', 'community']
        )
        # execute query
        return Anno.convert_document_to_message(index, query_string, query_options, offset, limit, user)

    @classmethod
    def query_by_active(cls, limit, offset, search_string, app_name, app_set, user):
        """
        This method queries anno records by 'active' order.
        'active' = last_update_time
        :param limit how many anno records to retrieve
        :param offset query offset which represents starting from which anno record.
        :param search_string search string which partial-matches to anno_text.
        :param app_name app name which full-matches to app_name, this parameter is a single app name, not an app list.
        :param app_set app name set.
        """
        index = search.Index(name=SearchIndexName.ANNO)
        # prepare pagination
        if limit is None:
            limit = 20  # default page size is 20.
        if offset is None:
            offset = 0
        query_string = Anno.get_query_string(search_string, app_name, app_set)
        if not is_empty_string(search_string):
            query_string = Anno.query_by_followup(search_string, query_string)
        sort = search.SortExpression(expression="last_update_time",
                                     direction=search.SortExpression.DESCENDING,
                                     default_value=datetime.datetime.now())
        sort_opts = search.SortOptions(expressions=[sort])
        query_options = search.QueryOptions(
            limit=limit,
            offset=offset,
            sort_options=sort_opts,
            returned_fields=['anno_text', 'app_name', 'last_update_time', 'community']
        )
        return Anno.convert_document_to_message(index, query_string, query_options, offset, limit, user)

    @classmethod
    def get_query_string(cls, search_string, app_name, app_set):
        """
        This method returns search query string based on the given search_string and app_name.
        :param search_string: search string which partial-matches to anno_text.
        :param app_name: app name which full-matches to app_name, this parameter is a single app name, not an app list.
        :param app_set: app name set.
        """
        query_string_parts = []

        if app_set is not None:  # 'limit to my app' is on
            if len(app_set) == 0:
                logging.info("final query string= 1 = 0")
                return "1 = 0"
            else:
                app_name_query_list = []
                for app in app_set:
                    app_name_query_list.append("app_name = \"%s\"" % app)
                query_string_parts.append("(" + ' OR '.join(app_name_query_list) + ")")

        if not is_empty_string(search_string):
            words = tokenize_string(search_string)
            query_string_parts.append(Anno.get_query_string_for_all_fields(["anno_text", "app_name"], words))

        if not is_empty_string(app_name):
            query_string_parts.append("( app_name = \"%s\" )" % app_name)

        query_string = ' AND '.join(query_string_parts)
        return query_string

    @classmethod
    def get_query_string_for_field(cls, field, words):
        """
        This method generates query string for a certain field against the given words.
        """
        if words is None or len(words) <= 0:
            return None
        query_string_for_field = field + " = ("
        for index, word in enumerate(words):
            query_string_for_field += "~%s" % word  # stemming
            if index != len(words) - 1:
                query_string_for_field += " OR "
        query_string_for_field += ")"
        return query_string_for_field

    @classmethod
    def get_query_string_for_all_fields(cls, fields, words):
        """
        This method generates query string for different fields against the given words.
        :param fields: different field names. As for now, we only support anno_text and app_name.
        :param words: tokens to match
        """
        if fields is not None and len(fields) > 0 and words is not None and len(words) > 0:
            query_string = "( "
            for index, field in enumerate(fields):
                query_string += Anno.get_query_string_for_field(field, words)
                if index != len(fields) - 1:
                    query_string += " OR "
            query_string += " )"
            return query_string
        return ""


    @classmethod
    def convert_document_to_message(cls, index, query_string, query_options, offset, limit, user):
        user_community_list = [ str(userrole.get("community").id()) for userrole in user_community(user) ]
        user_community_list.append(OPEN_COMMUNITY)

        if len(query_string):
            query_string += " AND "

        query_string += "( community = (%s) )" % (" OR ".join(user_community_list))
        logging.info("final query string: %s", query_string)

        query = search.Query(query_string=query_string, options=query_options)
        results = index.search(query)
        number_retrieved = len(results.results)
        anno_list = []
        has_more = False

        if number_retrieved > 0:
            has_more = (number_retrieved == limit)
            offset += number_retrieved
            for result in results:
                anno_id = long(result.doc_id)

                try:
                    anno = Anno.get_by_id(anno_id)
                except Exception as e:
                    logging.exception("Exception in convert_document_to_message. Anno ID: %s", anno_id)
                    anno = None

                if anno:
                    anno_list.append(anno.to_response_message(user))

        return AnnoListMessage(anno_list=anno_list, offset=offset, has_more=has_more)


    def generate_search_document(self):
        """
        This method generates a search document filled with current anno information.
        """
        anno_id_string = "%d" % self.key.id()
        app_name = "%s" % (self.app.get().name if self.app else self.app_name)
        anno_text = "%s" % self.anno_text
        community = ("%s" % self.community.id()) if self.community else OPEN_COMMUNITY

        anno_document = search.Document(
            doc_id=anno_id_string,
            fields=[
                    search.TextField(name='app_name', value=app_name),
                    search.TextField(name='anno_id', value=anno_id_string),
                    search.TextField(name='anno_text', value=anno_text),
                    search.NumberField(name='vote_count', value=self.vote_count),
                    search.NumberField(name='flag_count', value=self.flag_count),
                    search.DateField(name='created', value=self.created),
                    search.DateField(name='last_update_time', value=self.last_update_time),
                    search.TextField(name="community", value=community)
                ]
        )

        return anno_document

    @classmethod
    def query_anno_by_author(cls, user):
        """
        This methods return all annos created by the given user.
        """
        query = cls.query().filter(cls.creator == user.key).order(-cls.last_update_time)
        anno_list = []
        for anno in query:
            anno_list.append(anno)
        return anno_list
