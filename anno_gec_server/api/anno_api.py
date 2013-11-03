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

from message.anno_api_messages import AnnoMessage
from message.anno_api_messages import AnnoMergeMessage
from message.anno_api_messages import AnnoListMessage
from message.anno_api_messages import AnnoResponseMessage
from model.anno import Anno
from model.user import User
from api.utils import get_endpoints_current_user


@endpoints.api(name='anno', version='1.0', description='Anno API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID])
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
        return anno.to_response_message()


    anno_list_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        cursor=messages.StringField(2),
        limit=messages.IntegerField(3),
        select=messages.StringField(4)
    )

    @endpoints.method(anno_list_resource_container, AnnoListMessage, path='anno', http_method='GET', name='anno.list')
    def anno_list(self, request):
        """
        Exposes an API endpoint to retrieve a list of anno.
        """
        limit = 10 # default limit is 10.
        if request.limit is not None:
            limit = request.limit

        curs = None
        if request.cursor is not None:
            try:
                curs = Cursor(urlsafe=request.cursor)
            except BadValueError:
                raise endpoints.BadRequestException('Invalid cursor %s.' % request.cursor)

        select_projection = None
        # todo: add projection validation, may need metadata.
        if request.select is not None:
            select_projection = request.select.split(',')

        if (curs is not None) and (select_projection is not None):
            annos, next_curs, more = Anno.query().fetch_page(limit, start_cursor=curs, projection=select_projection)
        elif (curs is not None) and (select_projection is None):
            annos, next_curs, more = Anno.query().fetch_page(limit, start_cursor=curs)
        elif (curs is None) and (select_projection is not None):
            annos, next_curs, more = Anno.query().fetch_page(limit, projection=select_projection)
        else:
            annos, next_curs, more = Anno.query().fetch_page(limit)

        if select_projection is not None:
            items = [entity.to_response_message_by_projection(select_projection) for entity in annos]
        else:
            items = [entity.to_response_message() for entity in annos]

        if more:
            return AnnoListMessage(anno_list=items, cursor=next_curs.urlsafe(), has_more=more)
        else:
            return AnnoListMessage(anno_list=items, has_more=more)


    @endpoints.method(AnnoMessage, AnnoResponseMessage, path='anno', http_method='POST', name="anno.insert")
    def anno_insert(self, request):
        """
        Exposes an API endpoint to insert an anno for the current user.

        if current user doesn't exist, the user will be created first.
        """
        current_user = get_endpoints_current_user()
        user = User.find_user_by_email(current_user.email()).get()
        if user is None:
            user = User.insert_user(current_user.email())

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
