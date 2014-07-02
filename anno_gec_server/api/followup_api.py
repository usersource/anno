__author__ = 'topcircler'

import datetime

import endpoints
from protorpc import remote
from protorpc import messages
from protorpc import message_types
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext.db import BadValueError

from helper.settings import anno_js_client_id
from helper.utils import auth_user
from model.anno import Anno
from model.follow_up import FollowUp
from model.userannostate import UserAnnoState
from message.followup_message import FollowupMessage
from message.followup_message import FollowupListMessage
from helper.utils import put_search_document
from helper.activity_push_notifications import ActivityPushNotifications

@endpoints.api(name='followup', version='1.0', description='Followup API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class FollowupApi(remote.Service):
    """
    Class which defines Follow up API v1.
    """

    @endpoints.method(FollowupMessage, FollowupMessage, path='followup', http_method='POST', name='followup.insert')
    def followup_insert(self, request):
        """
        Exposes and API endpoint to insert a follow up for the current user.
        """
        user = auth_user(self.request_state.headers)

        anno = Anno.get_by_id(request.anno_id)
        if anno is None:
            raise endpoints.NotFoundException('No anno entity with the id "%s" exists.' % request.id)

        followup = FollowUp()
        followup.anno_key = anno.key
        followup.creator = user.key
        followup.comment = request.comment
        if request.created is not None:
            followup.created = request.created
        followup.put()

        anno.followup_count += 1
        anno.last_update_time = datetime.datetime.now()
        anno.last_activity = 'follwup'
        anno.last_update_type = 'create'
        anno.put()

        # update user anno state
        UserAnnoState.insert(user=user, anno=anno)

        # update search document
        put_search_document(anno.generate_search_document())

        # send notifications
        ActivityPushNotifications.send_notifications(first_user=user, anno=anno,
                                                 action_type="commented", comment=request.comment)

        return followup.to_message()

    followup_with_id_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.IntegerField(2, required=True)
    )

    @endpoints.method(followup_with_id_resource_container, message_types.VoidMessage, path='followup/{id}',
                      http_method='DELETE', name='followup.delete')
    def followup_delete(self, request):
        """
        Exposes an API endpoint to delete an existing follow up.
        """
        user = auth_user(self.request_state.headers)
        if request.id is None:
            raise endpoints.BadRequestException('id field is required.')
        followup = FollowUp.get_by_id(request.id)
        if followup is None:
            raise endpoints.NotFoundException('No follow up entity with the id "%s" exists.' % request.id)
        anno = followup.anno_key.get()
        followup.key.delete()
        anno.followup_count -= 1
        anno.put()
        return message_types.VoidMessage()


    @endpoints.method(followup_with_id_resource_container, FollowupMessage, http_method='GET', path='followup/{id}',
                      name='followup.get')
    def followup_get(self, request):
        """
        Exposes an API endpoint to get a followup.
        """
        user = auth_user(self.request_state.headers)
        if request.id is None:
            raise endpoints.BadRequestException('id field is required.')
        followup = FollowUp.get_by_id(request.id)
        if followup is None:
            raise endpoints.NotFoundException('No follow up entity with the id "%s" exists.' % request.id)
        return followup.to_message()

    followup_list_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        cursor=messages.StringField(2),
        limit=messages.IntegerField(3)
    )

    @endpoints.method(followup_list_resource_container, FollowupListMessage, path='followup', http_method='GET',
                      name='followup.list')
    def followup_list(self, request):
        """
        Exposes an API endpoint to retrieve a list of follow up.
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

        query = FollowUp.query().order(-FollowUp.created)
        if curs is not None:
            followups, next_curs, more = query.fetch_page(limit, start_cursor=curs)
        else:
            followups, next_curs, more = query.fetch_page(limit)

        items = [entity.to_message() for entity in followups]
        if more:
            return FollowupListMessage(followup_list=items, cursor=next_curs.urlsafe(), has_more=more)
        else:
            return FollowupListMessage(followup_list=items, has_more=more)
