"""
Anno API implemented using Google Cloud Endpoints.

.. http:get:: /anno/1.0/anno/{id}

    get the anno details for a specific anno `id`

    :param int id: the id of the anno
    :returns: the details of the anno :class:`.AnnoResponseMessage`

.. http:get:: /anno/1.0/anno

    get list of annos

    :param str cursor: <put description here>
    :param int limit: <put description here>
    :param str select: <put description here>
    :param str app: <desc>
    :param str query_type: <desc>
    :returns: a list of annos :class:`.AnnoListMessage`

.. http:post:: /anno/1.0/anno

    insert an anno

    :param: :class:`.AnnoMessage`
    :returns: details of the anno :class:`.AnnoResponseMessage`

"""

__author__ = 'topcircler'

import datetime
import logging

import endpoints
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext.db import BadValueError
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from message.anno_api_messages import AnnoMessage
from message.anno_api_messages import AnnoMergeMessage
from message.anno_api_messages import AnnoListMessage
from message.anno_api_messages import AnnoResponseMessage
from model.anno import Anno
from model.vote import Vote
from model.flag import Flag
from model.community import Community
from model.follow_up import FollowUp
from api.utils import anno_js_client_id
from api.utils import auth_user
from api.utils import put_search_document


@endpoints.api(name='anno', version='1.0', description='Anno API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class AnnoApi(remote.Service):
    """
    Class which defines Anno API v1.
    """

    anno_with_id_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.IntegerField(2, required=True)
    )

    @endpoints.method(anno_with_id_resource_container, AnnoResponseMessage, path='anno/{id}', http_method='GET',
                      name='anno.get')
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
        anno_resp_message = anno.to_response_message()
        # set anno association with followups
        followups = FollowUp.find_by_anno(anno)
        followup_messages = [entity.to_message() for entity in followups]
        anno_resp_message.followup_list = followup_messages
        # set anno association with votes/flags
        # if current user exists, then fetch vote/flag.
        if user is not None:
            anno_resp_message.is_my_vote = Vote.is_belongs_user(anno, user)
            anno_resp_message.is_my_flag = Flag.is_belongs_user(anno, user)
        return anno_resp_message


    anno_list_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        cursor=messages.StringField(2),
        limit=messages.IntegerField(3),
        select=messages.StringField(4),
        app=messages.StringField(5),
        query_type=messages.StringField(6),
        community=messages.IntegerField(7)
    )

    @endpoints.method(anno_list_resource_container, AnnoListMessage, path='anno', http_method='GET', name='anno.list')
    def anno_list(self, request):
        """
        Exposes an API endpoint to retrieve a list of anno.
        """
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

        select_projection = None
        if request.select is not None:
            select_projection = request.select.split(',')

        if request.query_type == 'by_created':
            return Anno.query_by_app_by_created(request.app, limit, select_projection, curs, user)
        elif request.query_type == 'by_vote_count':
            return Anno.query_by_vote_count(request.app, user)
        elif request.query_type == 'by_flag_count':
            return Anno.query_by_flag_count(request.app, user)
        elif request.query_type == 'by_activity_count':
            return Anno.query_by_activity_count(request.app, user)
        elif request.query_type == 'by_last_activity':
            return Anno.query_by_last_activity(request.app, user)
        elif request.query_type == 'by_country':
            return Anno.query_by_country(request.app, user)
        elif request.query_type == "by_community":
            community = Community.get_by_id(request.community)
            return Anno.query_by_community(community, limit, select_projection, curs)
        else:
            return Anno.query_by_page(limit, select_projection, curs, user)


    @endpoints.method(AnnoMessage, AnnoResponseMessage, path='anno', http_method='POST', name="anno.insert")
    def anno_insert(self, request):
        """
        Exposes an API endpoint to insert an anno for the current user.

        if current user doesn't exist, the user will be created first.
        """
        user = auth_user(self.request_state.headers)
        exist_anno = Anno.is_anno_exists(user, request)
        if exist_anno is not None:
            raise endpoints.BadRequestException("Duplicate anno(%s) already exists." % exist_anno.key.id())
        entity = Anno.insert_anno(request, user)

        # index this document. strange exception here.
        put_search_document(entity.generate_search_document())

        return entity.to_response_message()


    anno_update_resource_container = endpoints.ResourceContainer(
        AnnoMergeMessage,
        id=messages.IntegerField(2, required=True)
    )

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

        anno.merge_from_message(request)
        # set last update time & activity
        anno.last_update_time = datetime.datetime.now()
        anno.last_activity = 'anno'
        anno.put()
        # update search document.
        put_search_document(anno.generate_search_document())
        return anno.to_response_message()

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
        anno.key.delete()
        return message_types.VoidMessage()

    @endpoints.method(message_types.VoidMessage, AnnoListMessage, path='anno_my_stuff', http_method='GET',
                      name='anno.mystuff')
    def anno_my_stuff(self, request):
        """
        Exposes an API endpoint to return all my anno list.
        """
        user = auth_user(self.request_state.headers)
        anno_list = Anno.query_anno_by_author(user)
        vote_list = Vote.query_vote_by_author(user)
        for vote in vote_list:
            anno = Anno.get_by_id(vote.anno_key.id())
            if anno is not None:
                anno_list.append(anno)
        flag_list = Flag.query_flag_by_author(user)
        for flag in flag_list:
            anno = Anno.get_by_id(flag.anno_key.id())
            if anno is not None:
                anno_list.append(anno)
        followup_list = FollowUp.query_followup_by_author(user)
        for followup in followup_list:
            anno = Anno.get_by_id(followup.anno_key.id())
            if anno is not None:
                anno_list.append(anno)
        anno_set = list(set(anno_list))

        anno_message_list = []
        for anno in anno_set:
            anno_message_list.append(anno.to_response_message())
        return AnnoListMessage(anno_list=anno_message_list)

    anno_search_resource_container = endpoints.ResourceContainer(
        search_string=messages.StringField(1, required=False),
        app_name=messages.StringField(2, required=False),
        order_type=messages.StringField(3, required=True),
        cursor=messages.StringField(4),  # can't make it work, not sure why. may check it in the future.
        limit=messages.IntegerField(5),
        offset=messages.IntegerField(6),
        only_my_apps=messages.BooleanField(7)
    )

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
