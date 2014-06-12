__author__ = "rekenerd"

import logging

from google.appengine.ext import ndb

from model.appinfo import AppInfo

class Community(ndb.Model):
    name = ndb.StringProperty(required=True)
    description = ndb.StringProperty()
    welcome_msg = ndb.StringProperty()
    type = ndb.StringProperty(choices=["private", "public"], required=True)
    apps = ndb.KeyProperty(kind=AppInfo, repeated=True)
    created = ndb.DateTimeProperty(auto_now_add=True)
    
    communityType = dict(public="public", private="private")
    managerRole = "manager"

    @classmethod
    def insert(cls, message):
        try:
            if message.name is None:
                return "Community name is required"

            if message.type:
                # community should be of type 'private' or 'public'
                if not message.type in cls.communityType.values():
                    return "Community should be of type 'private' or 'public'"
                # only one public community is allowed
                elif (message.type == cls.communityType["public"]):
                    queryResultCount = Community.query(Community.type == cls.communityType["public"]).count()
                    if queryResultCount:
                        return "Community not created. Can't create more than one public community."
            else:
                message.type = cls.communityType["private"]

            community = cls(name=message.name, description=message.description,
                            welcome_msg=message.welcome_msg, type=message.type)
            community.put()
            respData = "Community created."
            from model.userrole import UserRole
            userrole = UserRole.insert(message.user, community, cls.managerRole)

            if userrole is None:
                community.delete()
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
        if request.community.id:
            community = cls.get_by_id(request.community.id)

        if request.app.id:
            app = AppInfo.get_by_id(request.app.id)

        if community and app:
            community.apps.append(app.key)
            community.put()

    @classmethod
    def getPublicCommunity(cls):
        return cls.query(cls.type == "public").get()
