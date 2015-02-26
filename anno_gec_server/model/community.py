import logging

from google.appengine.ext import ndb

from model.appinfo import AppInfo
from message.community_message import CommunityMessage
from helper.utils_enum import CommunityType, UserRoleType

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
    def insert(cls, message):
        try:
            from helper.utils import get_user_from_request, FIRST_CIRCLE

            if message.name is None:
                return "Community name is required"

            if message.type:
                # community should be of type 'private' or 'public'
                if not message.type in [CommunityType.PRIVATE, CommunityType.PUBLIC]:
                    return "Community should be of type 'private' or 'public'"
                # only one public community is allowed
                elif message.type == CommunityType.PUBLIC:
                    queryResultCount = Community.query(Community.type == message.type).count()
                    if queryResultCount:
                        return "Community not created. Can't create more than one public community."
            else:
                message.type = CommunityType.PRIVATE

            from helper.utils import md5
            team_hash = md5(message.team_key)[-8:]

            community = cls(name=message.name, description=message.description,
                            welcome_msg=message.welcome_msg, type=message.type,
                            team_key=message.team_key, team_secret=message.team_secret,
                            team_hash=team_hash)
            community.circles = { 0 : FIRST_CIRCLE }
            community.put()
            respData = "Community created."

            user = get_user_from_request(user_id=message.user.id, user_email=message.user.user_email,
                                         team_key=message.team_key)
            userrole = None
            userrole_type = UserRoleType.ADMIN if message.team_key else UserRoleType.MANAGER
            if user:
                from model.userrole import UserRole
                userrole = UserRole.insert(user, community, userrole_type)

            if userrole is None:
                community.key.delete()
                respData = "Community is not created as user doesn't exist"

        except Exception as e:
            logging.exception("Exception while inserting community: %s" % e)
            respData = e

        return respData

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
