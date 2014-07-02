__author__ = 'topcircler'

import endpoints
from protorpc import message_types
from protorpc import remote

from helper.settings import anno_js_client_id
from api.utils import validate_email
from api.utils import validate_password
from api.utils import md5
from api.utils import get_endpoints_current_user
from model.user import User
from message.account_message import AccountMessage
from message.user_message import UserMessage


@endpoints.api(name='account', version='1.0', description='Account API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class AccountApi(remote.Service):
    @endpoints.method(AccountMessage, UserMessage, path='account/register', http_method='POST',
                      name='account.register')
    def register(self, request):
        email = request.user_email
        validate_email(email)
        password = request.password
        validate_password(password)
        user = User.find_user_by_email(email)
        if user is not None:
            raise endpoints.BadRequestException("Email(" + email + ") already exists.")

        display_name = request.display_name
        if display_name is None or display_name == '':
            raise endpoints.BadRequestException("Registration failed. Display name is missing.")
        user = User.find_user_by_display_name(display_name)
        if user is not None:
            raise endpoints.BadRequestException("Display name(" + display_name + ") already exists.")

        user = User.insert_normal_user(email, display_name, md5(password))
        return UserMessage(id=user.key.id())

    @endpoints.method(AccountMessage, UserMessage, path='account/authenticate', http_method='POST',
                      name='account.authenticate')
    def authenticate(self, request):
        email = request.user_email
        validate_email(email)
        password = request.password
        validate_password(password)
        user = User.find_user_by_email(email)
        if not user:
            raise endpoints.NotFoundException("Authentication failed. User account " + email + " doesn't exist.")
        if not User.authenticate(email, md5(password)):
            raise endpoints.UnauthorizedException("Authentication failed. User name and password are not matched.")
        return UserMessage(id=user.key.id(), display_name=user.display_name)

    @endpoints.method(AccountMessage, message_types.VoidMessage, path='account/forgot_detail', http_method='POST',
                      name='account.forgot_detail')
    def forgot_details(self, request):
        email = request.user_email
        validate_email(email)
        if not User.find_user_by_email(email):
            raise endpoints.NotFoundException("Email(" + email + ") doesn't exist.")
            # send reset password email
        return message_types.VoidMessage()

    @endpoints.method(AccountMessage, message_types.VoidMessage, path='account/bind_account', http_method='POST',
                      name='account.bind_account')
    def bind_account(self, request):
        current_user = get_endpoints_current_user(raise_unauthorized=True)
        auth_source = request.auth_source
        if auth_source is None:
            auth_source = 'Google'
        email = current_user.email()
        user = User.find_user_by_email(email)
        if user is not None:
            user.auth_source = auth_source
            user.display_name = request.display_name
            user.put()
        else:
            User.insert_user(current_user.email(), request.display_name, auth_source)
        return message_types.VoidMessage()