__author__ = 'topcircler'

import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext.db import BadValueError
import datetime

from message.vote_message import VoteMessage
from message.vote_message import VoteListMessage
from api.utils import get_endpoints_current_user
from api.utils import anno_js_client_id
from api.utils import auth_user
from model.anno import Anno
from model.user import User
from model.vote import Vote


@endpoints.api(name='vote', version='1.0', description='Vote API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class VoteApi(remote.Service):
    """
    Class which defines Vote API v1.
    """

    @endpoints.method(VoteMessage, VoteMessage, path='vote', http_method='POST', name='vote.insert')
    def vote_insert(self, request):
        """
        Exposes an API endpoint to insert a vote for the current user.
        """
        user = auth_user(self.request_state.headers)

        anno = Anno.get_by_id(request.anno_id)
        if anno is None:
            raise endpoints.NotFoundException('No anno entity with the id "%s" exists.' % request.id)

        vote = Vote()
        vote.anno_key = anno.key
        vote.creator = user.key
        if request.created is not None:
            vote.created = request.created
        vote.put()

        anno.vote_count += 1
        anno.last_update_time = datetime.datetime.now()
        anno.last_activity = 'vote'
        anno.put()
        return vote.to_message()

    vote_with_id_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        anno_id=messages.IntegerField(2),
        id=messages.IntegerField(3)
    )

    @endpoints.method(vote_with_id_resource_container, message_types.VoidMessage, path='vote',
                      http_method='DELETE', name="vote.delete", )
    def vote_delete(self, request):
        """
        Exposes an API endpoint to delete an existing vote.
        """
        user = auth_user(self.request_state.headers)
        if request.id is None and request.anno_id is None:
            raise endpoints.BadRequestException('id or anno_id field is required.')
        if request.id is not None:
            vote = Vote.get_by_id(request.id)
            if vote is None:
                raise endpoints.NotFoundException('No vote entity with the id "%s" exists.' % request.id)
            anno = vote.anno_key.get()
            vote.key.delete()
            anno.vote_count -= 1
            anno.put()
        elif request.anno_id is not None:
            anno = Anno.get_by_id(request.anno_id)
            for key in Vote.query(Vote.anno_key == anno.key, Vote.creator == user.key).iter(keys_only=True):
                key.delete()
                anno.vote_count -= 1
                anno.put()
        return message_types.VoidMessage()

    @endpoints.method(vote_with_id_resource_container, VoteMessage, http_method='GET', path='vote/{id}',
                      name='vote.get')
    def vote_get(self, request):
        """
        Exposes an API endpoint to get a vote.
        """
        user = auth_user(self.request_state.headers)
        if request.id is None:
            raise endpoints.BadRequestException('id field is required.')
        vote = Vote.get_by_id(request.id)
        if vote is None:
            raise endpoints.NotFoundException('No vote entity with the id "%s" exists.' % request.id)
        return vote.to_message()

    vote_list_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        cursor=messages.StringField(2),
        limit=messages.IntegerField(3)
    )

    @endpoints.method(vote_list_resource_container, VoteListMessage, path='vote', http_method='GET', name='vote.list')
    def vote_list(self, request):
        """
        Exposes an API endpoint to retrieve a list of vote.
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
            votes, next_curs, more = Vote.query().fetch_page(limit, start_cursor=curs)
        else:
            votes, next_curs, more = Vote.query().fetch_page(limit)

        items = [entity.to_message() for entity in votes]
        if more:
            return VoteListMessage(vote_list=items, cursor=next_curs.urlsafe(), has_more=more)
        else:
            return VoteListMessage(vote_list=items, has_more=more)
