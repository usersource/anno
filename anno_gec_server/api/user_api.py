__author__ = 'topcircler'

import endpoints
from protorpc import message_types
from protorpc import remote
from protorpc import messages

from api.utils import anno_js_client_id
from api.utils import md5
from api.utils import get_endpoints_current_user
from api.utils import auth_user
from model.user import User
from message.user_message import UserMessage


@endpoints.api(name='user', version='1.0', description='User API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class UserApi(remote.Service):
    user_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        creator_id=messages.StringField(1, required=True)
    )

    @endpoints.method(user_resource_container, message_types.VoidMessage, path='user', http_method='POST',
                      name='user.insert')
    def user_insert(self, request):
        email = request.creator_id + "@gmail.com"
        user = User.find_user_by_email(email)
        if user is None:
            User.insert_user(email)
            print "user " + request.creator_id + " was inserted."
        else:
            print "user" + request.creator_id + " already exists."
        return message_types.VoidMessage()

    @endpoints.method(message_types.VoidMessage, UserMessage, path='user/display_name', http_method='GET',
                      name='user.displayname.get')
    def user_display_name_get(self, request):
        user = auth_user(self.request_state.headers)
        return UserMessage(display_name=user.display_name)

    @endpoints.method(UserMessage, message_types.VoidMessage, path='user/update_password', http_method='POST',
                      name='user.password.update')
    def update_password(self, request):
        current_user = get_endpoints_current_user(raise_unauthorized=False)
        if current_user is not None:
            raise endpoints.BadRequestException("Google OAuth User can't update password.")
        user = auth_user(self.request_state.headers)
        user.password = md5(request.password)
        user.put()
        return message_types.VoidMessage()
