"""
API implemented using Google Cloud Endpoints on :class:`.Anno` model


.. http:get:: /anno/1.0/anno/(id)

    ``anno.anno.get`` - Get the details for a specific anno

    :param int id: id of the anno
    :returns: details of the anno :class:`.AnnoResponseMessage`


.. http:get:: /anno/1.0/anno

    ``anno.anno.list`` - Get list of annos

    :param str cursor: resumption point in a query
    :param int limit: number of annos to be returned
    :param str select: fields that you want to retrieve
    :param str app: name of app for which we need annos
    :param str query_type: one of the :class:`.AnnoQueryType`
    :param int community: id of the community for which annos to be returned,
                          required only when query by **COMMUNITY** of :class:`.AnnoQueryType`
    :returns: a list of annos :class:`.AnnoListMessage`


.. http:post:: /anno/1.0/anno

    ``anno.anno.insert`` - Insert an anno

    :param: :class:`.AnnoMessage`
    :returns: details of the anno :class:`.AnnoResponseMessage`


.. http:post:: /anno/1.0/anno/(id)

    ``anno.anno.merge`` - Edit an specific anno

    :param int id: id of the anno
    :param: :class:`.AnnoMergeMessage`
    :returns: details of the anno :class:`.AnnoResponseMessage`

"""

__author__ = 'topcircler'

import datetime
import logging
import re

import endpoints
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext.db import BadValueError
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from message.anno_api_messages import AnnoMessage
from message.anno_api_messages import AnnoMergeMessage
from message.anno_api_messages import AnnoListMessage
from message.anno_api_messages import AnnoDashboardListMessage
from message.anno_api_messages import AnnoResponseMessage
from message.anno_api_messages import UserUnreadMessage
from message.anno_api_messages import AnnoTeamNotesMetadataMessage
from message.anno_api_messages import AnnoMentionsResponseMessage
from message.user_message import UserMessage
from message.user_message import UserListMessage
from model.anno import Anno
from model.vote import Vote
from model.flag import Flag
from model.community import Community
from model.follow_up import FollowUp
from model.userannostate import UserAnnoState
from model.tags import Tag
from model.appinfo import AppInfo
from model.user import User
from helper.settings import anno_js_client_id
from helper.utils import auth_user
from helper.utils import put_search_document
from helper.utils import extract_tags_from_text
from helper.utils import parseTeamNotesForHashtags
from helper.activity_push_notifications import ActivityPushNotifications
from helper.utils_enum import AnnoQueryType, AnnoActionType
from helper.utils_enum import SearchIndexName


@endpoints.api(name='anno', version='1.0', description='Anno API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class AnnoApi(remote.Service):
    """
    Class which defines Anno API v1.
    """

    anno_with_id_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.IntegerField(2, required=True),
        team_key=messages.StringField(3),
        team_notes=messages.StringField(4),
        tagged_users=messages.StringField(5, repeated=True)
    )

    anno_list_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        cursor=messages.StringField(2),
        limit=messages.IntegerField(3),
        select=messages.StringField(4),
        app=messages.StringField(5),
        query_type=messages.StringField(6),
        community=messages.IntegerField(7),
        is_plugin=messages.BooleanField(8),
        team_key=messages.StringField(9)
    )

    anno_update_resource_container = endpoints.ResourceContainer(
        AnnoMergeMessage,
        id=messages.IntegerField(2, required=True),
        app_name=messages.StringField(3),
        community_name=messages.StringField(4),
        platform_type=messages.StringField(5)
    )

    anno_search_resource_container = endpoints.ResourceContainer(
        search_string=messages.StringField(1, required=False),
        app_name=messages.StringField(2, required=False),
        order_type=messages.StringField(3, required=True),
        cursor=messages.StringField(4),  # can't make it work, not sure why. may check it in the future.
        limit=messages.IntegerField(5),
        offset=messages.IntegerField(6),
        only_my_apps=messages.BooleanField(7)
    )

    anno_user_email_resource_container =endpoints.ResourceContainer(
        user_email=messages.StringField(1),
        team_key=messages.StringField(2)
    )

    @endpoints.method(anno_with_id_resource_container, AnnoResponseMessage, path='anno/{id}',
                      http_method='GET', name='anno.get')
    def anno_get(self, request):
        """
        Exposes an API endpoint to get an anno detail by the specified id.
        """
        try:
            user = auth_user(self.request_state.headers)
        except Exception:
            user = None

        if request.id is None:
            raise endpoints.BadRequestException('id field is required.')

        anno = Anno.get_by_id(request.id)

        if anno is None:
            raise endpoints.NotFoundException('No anno entity with the id "%s" exists.' % request.id)

        # set anno basic properties
        anno_resp_message = anno.to_response_message(user, list_message=False)

        # set anno association with followups
        followups = FollowUp.find_by_anno(anno)
        followup_messages = [ entity.to_message(team_key=request.team_key) for entity in followups ]
        anno_resp_message.followup_list = followup_messages

        # set anno association with votes/flags
        # if current user exists, then fetch vote/flag.
        if user is not None:
            anno_resp_message.is_my_vote = Vote.is_belongs_user(anno, user)
            anno_resp_message.is_my_flag = Flag.is_belongs_user(anno, user)

            # update last_read of UserAnnoState
            UserAnnoState.update_last_read(user=user, anno=anno)

        return anno_resp_message


    @endpoints.method(anno_list_resource_container, AnnoListMessage, path='anno',
                      http_method='GET', name='anno.list')
    def anno_list(self, request):
        """
        Exposes an API endpoint to retrieve a list of anno.
        """
        user = auth_user(self.request_state.headers)

        limit = 10
        if request.limit is not None:
            limit = request.limit

        is_plugin = request.is_plugin or False

        curs = None
        if request.cursor is not None:
            try:
                curs = Cursor(urlsafe=request.cursor)
            except BadValueError:
                raise endpoints.BadRequestException('Invalid cursor %s.' % request.cursor)

        select_projection = None
        if request.select is not None:
            select_projection = request.select.split(',')

        if request.query_type == AnnoQueryType.CREATED:
            return Anno.query_by_app_by_created(request.app, limit, select_projection, curs, user)
        elif request.query_type == AnnoQueryType.VOTE_COUNT:
            return Anno.query_by_vote_count(request.app, user)
        elif request.query_type == AnnoQueryType.FLAG_COUNT:
            return Anno.query_by_flag_count(request.app, user)
        elif request.query_type == AnnoQueryType.ACTIVITY_COUNT:
            return Anno.query_by_activity_count(request.app, user)
        elif request.query_type == AnnoQueryType.LAST_ACTIVITY:
            return Anno.query_by_last_activity(request.app, user)
        elif request.query_type == AnnoQueryType.COUNTRY:
            return Anno.query_by_country(request.app, user)
        elif request.query_type == AnnoQueryType.COMMUNITY:
            community = Community.get_by_id(request.community)
            return Anno.query_by_community(community, limit, select_projection, curs, user)
        elif request.query_type == AnnoQueryType.APP:
            app = AppInfo.get(request.app)
            return Anno.query_by_app(app, limit, select_projection, curs, user)
        else:
            return Anno.query_by_page(limit, select_projection, curs, user, is_plugin)


    @endpoints.method(anno_list_resource_container, AnnoDashboardListMessage, path='anno/dashboard',
                      http_method='GET', name='anno.dashboard.list')
    def anno_dashboard_list(self, request):
        user = auth_user(self.request_state.headers)

        limit = 10
        if request.limit is not None:
            limit = request.limit

        curs = None
        if request.cursor is not None:
            try:
                curs = Cursor(urlsafe=request.cursor)
            except BadValueError:
                raise endpoints.BadRequestException('Invalid cursor %s.' % request.cursor)

        if request.query_type == AnnoQueryType.MY_MENTIONS:
            return Anno.query_by_my_mentions_for_dashboard(limit, curs, user)
        elif request.query_type == AnnoQueryType.ACTIVITY_COUNT:
            return Anno.query_by_count_for_dashboard(limit, curs, user, request.team_key, request.query_type)
        elif request.query_type == AnnoQueryType.VOTE_COUNT:
            return Anno.query_by_count_for_dashboard(limit, curs, user, request.team_key, request.query_type)
        elif request.query_type == AnnoQueryType.FLAG_COUNT:
            return Anno.query_by_count_for_dashboard(limit, curs, user, request.team_key, request.query_type)
        else:
            return Anno.query_by_page_for_dashboard(limit, curs, user)


    @endpoints.method(AnnoMessage, AnnoResponseMessage, path='anno',
                      http_method='POST', name="anno.insert")
    def anno_insert(self, request):
        """
        Exposes an API endpoint to insert an anno for the current user.

        if current user doesn't exist, the user will be created first.
        """
        user = auth_user(self.request_state.headers)

        # checking if same anno exists
        exist_anno = Anno.is_anno_exists(user, request)
        if exist_anno is not None:
            raise endpoints.BadRequestException("Duplicate anno(%s) already exists." % exist_anno.key.id())

        entity = Anno.insert_anno(request, user)

        # find all hashtags
        tags = extract_tags_from_text(entity.anno_text.lower())
        for tag, count in tags.iteritems():
            # Write the cumulative amount per tag
            Tag.add_tag_total(tag, total=count)

        # index this document. strange exception here.
        put_search_document(entity.generate_search_document(), SearchIndexName.ANNO)

        # send push notifications
        ActivityPushNotifications.send_push_notification(first_user=user, anno=entity, action_type=AnnoActionType.CREATED)

        return entity.to_response_message(user)


    @endpoints.method(anno_update_resource_container, AnnoResponseMessage, path='anno/{id}',
                      http_method='POST', name="anno.merge")
    def anno_merge(self, request):
        """
        Exposes an API endpoint to merge(update only the specified properties) an anno.
        """
        user = auth_user(self.request_state.headers)

        if request.id is None:
            raise endpoints.BadRequestException('id field is required.')

        anno = Anno.get_by_id(request.id)

        if anno is None:
            raise endpoints.NotFoundException('No anno entity with the id "%s" exists.' % request.id)

        anno.merge_from_message(request, user)
        # set last update time & activity
        anno.last_update_time = datetime.datetime.now()
        anno.last_activity = 'anno'
        anno.put()

        # update search document.
        put_search_document(anno.generate_search_document(), SearchIndexName.ANNO)

        # send notifications
        ActivityPushNotifications.send_push_notification(first_user=user, anno=anno, action_type=AnnoActionType.EDITED)

        # update last_read of UserAnnoState
        from model.userannostate import UserAnnoState
        UserAnnoState.update_last_read(user=user, anno=anno)

        return anno.to_response_message(user)


    @endpoints.method(anno_with_id_resource_container, message_types.VoidMessage, path='anno/{id}',
                      http_method='DELETE', name="anno.delete")
    def anno_delete(self, request):
        """
        Exposes an API endpoint to delete an existing anno.
        """
        user = auth_user(self.request_state.headers)

        if request.id is None:
            raise endpoints.BadRequestException('id field is required.')

        anno = Anno.get_by_id(request.id)

        if anno is None:
            raise endpoints.NotFoundException('No anno entity with the id "%s" exists.' % request.id)

        # send notifications
        ActivityPushNotifications.send_push_notification(first_user=user, anno=anno, action_type=AnnoActionType.DELETED)

        Anno.delete(anno)
        return message_types.VoidMessage()


    @endpoints.method(anno_list_resource_container, AnnoListMessage, path='anno_my_stuff',
                      http_method='GET', name='anno.mystuff')
    def anno_my_stuff(self, request):
        """
        Exposes an API endpoint to return all my anno list.
        """
        user = auth_user(self.request_state.headers)
        limit = request.limit or 10

        curs = None
        if request.cursor is not None:
            try:
                curs = Cursor(urlsafe=request.cursor)
            except BadValueError:
                raise endpoints.BadRequestException('Invalid cursor %s.' % request.cursor)

        return Anno.query_my_anno(limit, curs, user)


    @endpoints.method(anno_search_resource_container, AnnoListMessage, path='anno_search', http_method='GET',
                      name='anno.search')
    def anno_search(self, request):
        """
        Exposes and API endpoint to search anno list.
        """
        user = auth_user(self.request_state.headers)

        if request.order_type is None:
            raise endpoints.BadRequestException('order_type field is required.')
        if request.order_type != 'recent' and request.order_type != 'active' and request.order_type != 'popular':
            raise endpoints.BadRequestException(
                'Invalid order_type field value, valid values are "recent", "active" and "popular"')

        app_set = None
        logging.info("only_my_apps=%s" % request.only_my_apps)
        if request.only_my_apps:
            app_set = set()
            for anno in Anno.query_anno_by_author(user):
                app_set.add(anno.app_name)
            for vote in Vote.query_vote_by_author(user):
                anno = Anno.get_by_id(vote.anno_key.id())
                if anno is not None:
                    app_set.add(anno.app_name)
            for flag in Flag.query_flag_by_author(user):
                anno = Anno.get_by_id(flag.anno_key.id())
                if anno is not None:
                    app_set.add(anno.app_name)
            for followup in FollowUp.query_followup_by_author(user):
                anno = Anno.get_by_id(followup.anno_key.id())
                if anno is not None:
                    app_set.add(anno.app_name)

        if request.order_type == 'popular':
            return Anno.query_by_popular(request.limit, request.offset,
                                         request.search_string, request.app_name, app_set, user)
        elif request.order_type == 'active':
            return Anno.query_by_active(request.limit, request.offset, request.search_string, request.app_name, app_set, user)
        else:
            return Anno.query_by_recent(request.limit, request.offset, request.search_string, request.app_name, app_set, user)

    @endpoints.method(anno_user_email_resource_container, UserUnreadMessage,
                      path="user/unread", http_method="GET", name="user.unread")
    def get_unread_count(self, request):
        return UserUnreadMessage(unread_count=UserAnnoState.get_unread_count(request))

    @endpoints.method(anno_with_id_resource_container, UserListMessage,
                      path="anno/users/{id}", http_method="GET", name="anno.anno.users")
    def getEngagedUsers(self, request):
        user = auth_user(self.request_state.headers)
        return UserListMessage(user_list=Anno.getEngagedUsers(anno_id=request.id, auth_user=user))

    @endpoints.method(anno_with_id_resource_container, AnnoTeamNotesMetadataMessage, path='anno/teamnotes',
                      http_method='POST', name='anno.teamnotes.insert')
    def anno_teamnotes_insert(self, request):
        anno = Anno.get_by_id(request.id)
        user = auth_user(self.request_state.headers)

        if anno:
            anno.team_notes = request.team_notes
            UserAnnoState.tag_users(anno, anno.tagged_users, request.tagged_users)
            anno.tagged_users = request.tagged_users
            anno.put()

        mentions = []
        for tagged_user in request.tagged_users:
            user_info = User.get_by_id(int(tagged_user))
            is_auth_user = user_info.user_email == user.user_email
            mentions.append(AnnoMentionsResponseMessage(id=user_info.key.id(),
                                                        display_name=user_info.display_name,
                                                        user_email=user_info.user_email,
                                                        image_url=user_info.image_url,
                                                        is_auth_user=is_auth_user))

        return AnnoTeamNotesMetadataMessage(tags=parseTeamNotesForHashtags(request.team_notes),
                                            mentions=mentions)

    @endpoints.method(anno_with_id_resource_container, message_types.VoidMessage, path='anno/archive',
                      http_method='POST', name='anno.archive')
    def anno_archive(self, request):
        Anno.archive(request.id)
        return message_types.VoidMessage()
