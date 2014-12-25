import endpoints
from protorpc import message_types
from protorpc import remote

from helper.settings import anno_js_client_id
from helper.utils import validate_email
from helper.utils import validate_password
from helper.utils import validate_team_secret
from helper.utils import md5
from helper.utils import get_endpoints_current_user
from helper.utils import reset_password
from helper.utils import get_user_team_token
from helper.utils_enum import AuthSourceType
from model.user import User
from model.community import Community
from model.userrole import UserRole
from message.account_message import AccountMessage
from message.account_message import AccountAuthenticateMessage
from message.account_message import UserTeamTokenMessage
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

        user = User.insert_user(email=email, username=display_name, password=md5(password))
        return UserMessage(id=user.key.id())

    @endpoints.method(AccountMessage, UserMessage, path='account/authenticate',
                      http_method='POST', name='account.authenticate')
    def authenticate(self, request):
        email = request.user_email
        validate_email(email)
        team_key = request.team_key
        user = User.find_user_by_email(email, team_key)

        if team_key:
            team_secret = request.team_secret
            validate_team_secret(team_secret)

            display_name = request.display_name
            image_url = request.user_image_url

            if not user:
                user = User.insert_user(email=email, username=display_name, account_type=team_key, image_url=image_url)
                community = Community.getCommunityFromTeamKey(team_key)
                UserRole.insert(user, community)
            elif (display_name != user.display_name) or (image_url != user.image_url):
                User.update_user(user=user, email=email, username=display_name, account_type=team_key, image_url=image_url)
            if not Community.authenticate(team_key, md5(team_secret)):
                raise endpoints.UnauthorizedException("Authentication failed. Team key and secret are not matched.")
        else:
            password = request.password
            validate_password(password)
            if not user:
                raise endpoints.NotFoundException("Authentication failed. User account " + email + " doesn't exist.")
            if not User.authenticate(email, md5(password)):
                raise endpoints.UnauthorizedException("Authentication failed. Email and password are not matched.")

        return UserMessage(id=user.key.id(), display_name=user.display_name)

    @endpoints.method(AccountMessage, AccountAuthenticateMessage, path="account/dashboard/authenticate",
                      http_method="POST", name="account.dashboard.authenticate")
    def dashboard_authenticate(self, request):
        email = request.user_email
        password = request.password

        authenticated = False
        teams = []

        users = User.get_all_user_by_email(email, password)

        for user in users:
            team = Community.getCommunityFromTeamKey(user.account_type)
            if team:
                userTeamToken = get_user_team_token(email, password, team.team_key,
                                                    team.team_secret, user.display_name, user.image_url)
                teams.append(UserTeamTokenMessage(display_name=user.display_name,
                                                  image_url=user.image_url,
                                                  team_name=team.name,
                                                  team_key=team.team_key,
                                                  user_team_token=userTeamToken))

        if len(teams): authenticated = True
        return AccountAuthenticateMessage(authenticated=authenticated, teams=teams)

    @endpoints.method(AccountMessage, message_types.VoidMessage, path='account/forgot_detail',
                      http_method='POST', name='account.forgot_detail')
    def forgot_details(self, request):
        user = User.find_user_by_email(request.user_email)

        if user:
            if user.auth_source == AuthSourceType.ANNO:
                validate_email(request.user_email)
                reset_password(user, request.user_email)
            else:
                raise endpoints.ForbiddenException("Account for '%s' is Google OAuth account." % request.user_email)
        else:
            raise endpoints.NotFoundException("Email address is not found. Please enter correct email address.")

        return message_types.VoidMessage()

    @endpoints.method(AccountMessage, message_types.VoidMessage, path='account/bind_account', http_method='POST',
                      name='account.bind_account')
    def bind_account(self, request):
        current_user = get_endpoints_current_user(raise_unauthorized=True)
        auth_source = request.auth_source
        if auth_source is None:
            auth_source = AuthSourceType.GOOGLE
        email = current_user.email()
        user = User.find_user_by_email(email)
        if user is not None:
            user.auth_source = auth_source
            user.display_name = request.display_name
            user.put()
        else:
            User.insert_user(email=current_user.email(), username=request.display_name)
        return message_types.VoidMessage()
