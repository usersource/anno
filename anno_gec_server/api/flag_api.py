__author__ = 'topcircler'

import datetime

import endpoints
from protorpc import remote
from protorpc import message_types
from protorpc import messages
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext.db import BadValueError

from message.flag_message import FlagMessage
from message.flag_message import FlagListMessage
from model.flag import Flag
from model.anno import Anno
from model.userannostate import UserAnnoState
from helper.settings import anno_js_client_id
from helper.utils import auth_user
from helper.utils import put_search_document
from helper.utils_enum import SearchIndexName

@endpoints.api(name='flag', version='1.0', description='Flag API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class FlagApi(remote.Service):
    """
    Class which defines Flag API v1.
    """

    @endpoints.method(FlagMessage, FlagMessage, path='flag', http_method='POST', name='flag.insert')
    def flag_insert(self, request):
        """
        Exposes an API endpoint to insert a flag for the current user.
        """
        user = auth_user(self.request_state.headers)

        anno = Anno.get_by_id(request.anno_id)
        if anno is None:
            raise endpoints.NotFoundException('No anno entity with the id "%s" exists.')

        flag = Flag()
        flag.anno_key = anno.key
        flag.creator = user.key
        if request.created is not None:
            flag.created = request.created
        flag.put()

        anno.flag_count += 1
        anno.last_update_time = datetime.datetime.now()
        anno.last_activity = 'flag'
        anno.last_update_type = 'create'
        anno.put()

        # update user anno state
        UserAnnoState.insert(user=user, anno=anno)

        # update flag in search document
        put_search_document(anno.generate_search_document(), SearchIndexName.ANNO)

        return flag.to_message()

    flag_with_id_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.IntegerField(2),
        anno_id=messages.IntegerField(3)
    )

    @endpoints.method(flag_with_id_resource_container, message_types.VoidMessage, path='flag',
                      http_method='DELETE', name='flag.delete')
    def flag_delete(self, request):
        """
        Exposes an API endpoint to delete an existing flag.
        """
        user = auth_user(self.request_state.headers)
        anno = None
        if request.id is None and request.anno_id is None:
            raise endpoints.BadRequestException('id or anno_id field is required.')
        if request.id is not None:
            flag = Flag.get_by_id(request.id)
            if flag is None:
                raise endpoints.NotFoundException('No flag entity with the id "%s" exists.' % request.id)

            anno = flag.anno_key.get()
            flag.key.delete()
            anno.flag_count -= 1
            anno.put()
        elif request.anno_id is not None:
            anno = Anno.get_by_id(request.anno_id)
            for key in Flag.query(Flag.anno_key == anno.key, Flag.creator == user.key).iter(keys_only=True):
                key.delete()
                anno.flag_count -= 1
                anno.put()
        put_search_document(anno.generate_search_document(), SearchIndexName.ANNO)
        return message_types.VoidMessage()

    @endpoints.method(flag_with_id_resource_container, FlagMessage, http_method='GET', path='flag/{id}',
                      name='flag.get')
    def flag_get(self, request):
        """
        Exposes an API endpoint to get a flag.
        """
        user = auth_user(self.request_state.headers)
        if request.id is None:
            raise endpoints.BadRequestException('id field is required.')
        flag = Flag.get_by_id(request.id)
        if flag is None:
            raise endpoints.NotFoundException('No flag entity with the id "%s" exists.' % request.id)
        return flag.to_message()

    flag_list_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        cursor=messages.StringField(2),
        limit=messages.IntegerField(3)
    )

    @endpoints.method(flag_list_resource_container, FlagListMessage, path='flag', http_method='GET', name='flag.list')
    def flag_list(self, request):
        """
        Exposes an API endpoint to retrieve a list of flag.
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

        if curs is not None:
            flags, next_curs, more = Flag.query().fetch_page(limit, start_cursor=curs)
        else:
            flags, next_curs, more = Flag.query().fetch_page(limit)

        items = [entity.to_message() for entity in flags]
        if more:
            return FlagListMessage(flag_list=items, cursor=next_curs.urlsafe(), has_more=more)
        else:
            return FlagListMessage(flag_list=items, has_more=more)
