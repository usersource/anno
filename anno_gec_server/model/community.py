import logging
import random

from google.appengine.ext import ndb

from model.appinfo import AppInfo
from model.user import User
from message.community_message import CommunityMessage
from message.community_message import CommunityAdminMasterMessage
from message.appinfo_message import AppInfoMessage
from message.user_message import UserMessage
from message.user_message import UserAdminMasterMessage
from helper.utils_enum import CommunityType, UserRoleType, AuthSourceType
from helper.utils_enum import CircleType, CircleValue
from helper.utils_enum import PlanType

class Community(ndb.Model):
    name = ndb.StringProperty(required=True)
    description = ndb.StringProperty()
    welcome_msg = ndb.TextProperty()
    type = ndb.StringProperty(choices=[CommunityType.PRIVATE, CommunityType.PUBLIC], required=True)
    apps = ndb.KeyProperty(kind=AppInfo, repeated=True)
    created = ndb.DateTimeProperty(auto_now_add=True)
    team_key = ndb.StringProperty()
    team_secret = ndb.StringProperty()
    circles = ndb.JsonProperty()
    team_hash = ndb.StringProperty()
    plan = ndb.StringProperty()

    def to_response_message(self):
        return CommunityMessage(id=self.key.id(),
                                name=self.name,
                                description=self.description,
                                welcome_msg=self.welcome_msg,
                                type=self.type,
                                created=self.created
                            )

    @classmethod
    def authenticate(cls, team_key, team_secret):
        query = cls.query().filter(ndb.AND(cls.team_key == team_key, cls.team_secret == team_secret))
        return query.get() is not None

    @classmethod
    def getCommunity(cls, community_id=None, community_name=None):
        community = None

        if community_id:
            community = cls.get_by_id(community_id)
        if community_name:
            community = cls.query(cls.name == community_name).get()

        return community.to_response_message() if community else None

    @classmethod
    def getCommunityFromTeamKey(cls, team_key):
        return cls.query(cls.team_key == team_key).get()

    @classmethod
    def insert(cls, message, getCommunity=False):
        community, user = None, None

        try:
            from helper.utils import get_user_from_request

            if message.name is None:
                return "Community name is required" if not getCommunity else (community, user)

            if message.type:
                # community should be of type 'private' or 'public'
                if not message.type in [CommunityType.PRIVATE, CommunityType.PUBLIC]:
                    return "Community should be of type 'private' or 'public'" if not getCommunity else (community, user)
                # only one public community is allowed
                elif message.type == CommunityType.PUBLIC:
                    queryResultCount = Community.query(Community.type == message.type).count()
                    if queryResultCount:
                        return "Community not created. Can't create more than one public community." if not getCommunity else (community, user)
            else:
                message.type = CommunityType.PRIVATE

            community = cls.getCommunityFromTeamKey(team_key=message.team_key)
            if not community:
                from helper.utils import md5
                team_hash = md5(message.team_key)[-8:]

                community = cls(name=message.name, description=message.description,
                                welcome_msg=message.welcome_msg, type=message.type,
                                team_key=message.team_key, team_secret=message.team_secret,
                                team_hash=team_hash, plan=message.plan)
                community.circles = { CircleValue.CONTRIBUTOR : CircleType.CONTRIBUTOR,
                                      CircleValue.BETA_TESTER : CircleType.BETA_TESTER,
                                      CircleValue.ALPHA_TESTER : CircleType.ALPHA_TESTER,
                                      CircleValue.DEVELOPER : CircleType.DEVELOPER }
                community.put()
                respData = "Community created."

            user = get_user_from_request(user_id=message.user.id,
                                         user_email=message.user.user_email,
                                         team_key=message.team_key)
            userrole = None
            userrole_type = UserRoleType.ADMIN if message.team_key else UserRoleType.MANAGER

            if (not user) and message.team_key and message.user.user_email:
                from model.user import User
                from helper.utils import md5
                user = User.insert_user(message.user.user_email,
                                        username=message.user.display_name,
                                        account_type=message.team_key,
                                        auth_source=AuthSourceType.PLUGIN,
                                        password=md5(message.user.password),
                                        image_url="")

            if user:
                from model.userrole import UserRole
                userrole = UserRole.insert(user, community, userrole_type, int(CircleValue.DEVELOPER))

            if userrole is None:
                community.key.delete()
                respData = "Community is not created as user doesn't exist"

        except Exception as e:
            logging.exception("Exception while inserting community: %s" % e)
            respData = e

        return respData if not getCommunity else (community, user)

    @classmethod
    def update(cls, message):
        community = Community.getCommunityFromTeamKey(message.team_key)
        if community:
            community.name = message.name or community.name
            community.put()

    @classmethod
    def update_teamkey(cls, message):
        community = Community.getCommunityFromTeamKey(message.team_key)
        if community:
            community.team_key = message.new_team_key or community.team_key
            community.put()

            for user in User.get_all_user_by_team_key(message.team_key):
                user.account_type = message.new_team_key
                user.put()

    @classmethod
    def update_appicon(cls, message):
        community = Community.getCommunityFromTeamKey(message.team_key)
        if community and len(community.apps):
            community_app = community.apps[0].get()
            if community_app:
                community_app.icon_url = message.app_icon or community.icon_url
                community_app.put()

    @classmethod
    def delete(cls, community):
        community.key.delete()

    @classmethod
    def addApp(cls, request):
        entity = None
        community_id = request.community.id
        appinfo_id = request.app.id
        community = cls.get_by_id(community_id) if community_id else None
        app = AppInfo.get_by_id(appinfo_id) if appinfo_id else None

        if community and app:
            if not app.key in community.apps:
                community.apps.append(app.key)
                entity = community.put()
        return entity

    @classmethod
    def addCircle(cls, request):
        entity = None
        community_id = request.id
        community = cls.get_by_id(community_id) if community_id else None

        circle_name = request.circle_name
        circle_value = request.circle_value

        if community and circle_name and circle_value:
            community.circles[circle_value] = circle_name
            entity = community.put()
            print community.circles
        return entity

    @classmethod
    def getCircleLevelValue(cls, community=None, circle_level=0):
        return community.get().circles.get(str(circle_level))

    @classmethod
    def get_by_hash(cls, team_hash):
        return cls.query().filter(cls.team_hash == team_hash).get()

    @classmethod
    def reset_team_secret(cls, team_key):
        team_secret = None
        community = cls.getCommunityFromTeamKey(team_key)
        if community:
            from helper.utils import md5
            community.team_secret = md5(hex(random.randint(1000000, 9999999))[2:])
            team_secret = community.team_secret
            community.put()

        return team_secret

    @classmethod
    def create_sdk_team(cls, message):
        team_key = message.team_key
        app_name = message.app.name
        community_name = message.community_name or app_name
        plan = message.plan or PlanType.BASIC

        app = AppInfo.query().filter(AppInfo.lc_name == app_name.lower()).get()
        if not app:
            appinfo_message = AppInfoMessage()
            appinfo_message.name = app_name
            appinfo_message.icon_url = message.app.icon_url
            appinfo_message.version = message.app.version
            app = AppInfo.insert(appinfo_message)

        from helper.utils import md5
        community_message = CommunityMessage(name=community_name,
                                             team_key=team_key,
                                             team_secret=md5(community_name.lower()),
                                             plan=plan)
        community_message.user = UserMessage(user_email=message.admin_user.user_email,
                                             display_name=message.admin_user.display_name,
                                             password=message.admin_user.password)
        community, user = cls.insert(community_message, getCommunity=True)

        communities_message = []
        if community and app:
            if not app.key in community.apps:
                community.apps.append(app.key)
                community.put()

            # response message
            community_message = CommunityAdminMasterMessage()
            community_message.community_name = community.name
            community_message.team_key = community.team_key
            community_message.team_secret = community.team_secret
            # community_message.team_hash = community.team_hash
            community_message.app_name = app.name
            community_message.app_icon = app.icon_url

            community_message.users = []
            from model.userrole import UserRole

            user_message = UserAdminMasterMessage()
            user_message.display_name = user.display_name
            user_message.user_email = user.user_email
            user_message.password_present = True if user.password else False
            user_message.role = UserRole.getRole(user, community)
            user_message.image_url = user.image_url

            if community.circles:
                user_message.circle = community.circles.get(str(UserRole.getCircleLevel(user, community)))

            community_message.users.append(user_message)
            communities_message.append(community_message)

            from helper.utils import send_created_team_email
            from helper.utils import send_access_team_email
            send_created_team_email(community.name, user.display_name)
            send_access_team_email(user.user_email, community.team_hash, community.name)

        return communities_message
