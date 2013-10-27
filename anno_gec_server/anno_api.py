__author__ = 'topcircler'

"""
Anno API implemented using Google Cloud Endpoints.
"""

import endpoints
import logging
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext.db import BadValueError

from protorpc import message_types
from protorpc import messages
from protorpc import remote

from anno_api_messages import AnnoMessage
from anno_api_messages import AnnoMergeRequestMessage
from anno_api_messages import AnnoListMessage
from model.anno import Anno

package = 'core'

@endpoints.api(name='anno', version='v1', description='Anno API', allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID])
class AnnoApi(remote.Service):
    """
    Class which defines Anno API v1.
    """

    anno_get_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.IntegerField(2, required=True)
    )
    @endpoints.method(anno_get_resource_container, AnnoMessage, path='anno/{id}', http_method='GET', name='anno.get')
    def anno_get(self, request):
        """
        Exposes an API endpoint to get an anno detail by the specified id.
        """
        anno = Anno.get_by_id(request.id)
        if anno is None:
            raise endpoints.NotFoundException('No anno entity with the id "%s" exists.' % request.id)
        else:
            return anno.to_message()


    anno_list_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        cursor=messages.StringField(2),
        limit=messages.IntegerField(3)
    )
    @endpoints.method(anno_list_resource_container, AnnoListMessage, path='anno', http_method='GET', name='anno.list')
    def anno_list(self, request):
        """
        Exposes an API endpoint to retrieve a list of anno.
        """
        limit = 10;
        if request.limit is not None:
            limit = request.limit
        if request.cursor is not None:
            try:
                curs = Cursor(urlsafe=request.cursor)
            except BadValueError:
                raise endpoints.BadRequestException('Invalid cursor %s.' % request.cursor)
            annos, next_curs, more = Anno.query().fetch_page(limit, start_cursor=curs)
        else:
            annos, next_curs, more = Anno.query().fetch_page(limit)
        items = [entity.to_message() for entity in annos]
        if more:
            return AnnoListMessage(anno_list=items, cursor=next_curs.urlsafe(), has_more=more)
        else:
            return AnnoListMessage(anno_list=items, has_more=more)


    @endpoints.method(AnnoMessage, AnnoMessage, path='anno', http_method='POST', name="anno.insert")
    def anno_insert(self, request):
        """
        Exposes an API endpoint to insert an anno for the current user.
        """
        entity = Anno.put_from_message(request)
        return entity.to_message()


    anno_update_resource_container = endpoints.ResourceContainer(
        AnnoMergeRequestMessage,
        id=messages.IntegerField(2, required=True)
    )
    @endpoints.method(anno_update_resource_container, AnnoMessage, path='anno/{id}',
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
        return anno.to_message()


APPLICATION = endpoints.api_server([AnnoApi], restricted=False)