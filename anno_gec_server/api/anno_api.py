__author__ = 'topcircler'

"""
Anno API implemented using Google Cloud Endpoints.
"""

import endpoints
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext.db import BadValueError
from protorpc import message_types
from protorpc import messages
from protorpc import remote
from google.appengine.ext import ndb
import datetime

from message.anno_api_messages import AnnoMessage
from message.anno_api_messages import AnnoMergeMessage
from message.anno_api_messages import AnnoListMessage
from message.anno_api_messages import AnnoResponseMessage
from model.anno import Anno
from model.user import User
from model.vote import Vote
from model.flag import Flag
from model.follow_up import FollowUp
from api.utils import get_endpoints_current_user
from api.utils import handle_user
from api.utils import anno_js_client_id


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
        current_user = endpoints.get_current_user()
        if current_user is not None:
            user = User.find_user_by_email(current_user.email())
            anno_resp_message.is_my_vote = Vote.is_belongs_user(anno, user)
            anno_resp_message.is_my_flag = Flag.is_belongs_user(anno, user)
        return anno_resp_message


    anno_list_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        cursor=messages.StringField(2),
        limit=messages.IntegerField(3),
        select=messages.StringField(4),
        app=messages.StringField(5),
        query_type=messages.StringField(6)
    )

    @endpoints.method(anno_list_resource_container, AnnoListMessage, path='anno', http_method='GET', name='anno.list')
    def anno_list(self, request):
        """
        Exposes an API endpoint to retrieve a list of anno.
        """
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
            return Anno.query_by_app_by_created(request.app, limit, select_projection, curs)
        elif request.query_type == 'by_vote_count':
            return Anno.query_by_vote_count(request.app)
        elif request.query_type == 'by_flag_count':
            return Anno.query_by_flag_count(request.app)
        elif request.query_type == 'by_activity_count':
            return Anno.query_by_activity_count(request.app)
        elif request.query_type == 'by_last_activity':
            return Anno.query_by_last_activity(request.app)
        elif request.query_type == 'by_country':
            return Anno.query_by_country(request.app)
        else:
            return Anno.query_by_page(limit, select_projection, curs)


    @endpoints.method(AnnoMessage, AnnoResponseMessage, path='anno', http_method='POST', name="anno.insert")
    def anno_insert(self, request):
        """
        Exposes an API endpoint to insert an anno for the current user.

        if current user doesn't exist, the user will be created first.
        """
        user = handle_user(request.creator_id)
        entity = Anno.insert_anno(request, user)
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
        if request.id is None:
            raise endpoints.BadRequestException('id field is required.')
        anno = Anno.get_by_id(request.id)
        if anno is None:
            raise endpoints.NotFoundException('No anno entity with the id "%s" exists.' % request.id)

        anno.merge_from_message(request)
        anno.put()
        return anno.to_response_message()

    @endpoints.method(anno_with_id_resource_container, message_types.VoidMessage, path='anno/{id}',
                      http_method='DELETE', name="anno.delete")
    def anno_delete(self, request):
        """
        Exposes an API endpoint to delete an existing anno.
        """
        if request.anno_id is None:
            raise endpoints.BadRequestException('id field is required.')
        anno = Anno.get_by_id(request.anno_id)
        if anno is None:
            raise endpoints.NotFoundException('No anno entity with the id "%s" exists.' % request.id)
        anno.key.delete()
        return message_types.VoidMessage()
