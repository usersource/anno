__author__ = "rekenerd"

import logging

from model.community import Community
from model.appinfo import AppInfo
from handler.userrole_handler import UserRoleHandler

class CommunityHandler():
    communityType = dict(public="public", private="private")
    managerRole = "manager"
    
    @classmethod
    def insert(cls, request):
        try:
            if request.name is None:
                return "Community name is required"

            if request.type:
                # community should be of type 'private' or 'public'
                if not request.type in cls.communityType.values():
                    return "Community should be of type 'private' or 'public'"
                # only one public community is allowed
                elif (request.type == cls.communityType["public"]):
                    queryResultCount = Community.query(Community.type == cls.communityType["public"]).count()
                    if queryResultCount:
                        return "Community not created. Can't create more than one public community."
            else:
                request.type = cls.communityType["private"]

            community = Community.insert(request)
            respData = "Community created."
            userrole = UserRoleHandler.insert(request.user, community, cls.managerRole)

            if userrole is None:
                community.delete()
                respData = "Community is not created as user doesn't exist"

        except Exception as e:
            logging.exception("Exception while inserting community: %s" % e)
            respData = e

        return respData
    
    @classmethod
    def addApp(cls, request):
        if request.community.id:
            community = Community.get_by_id(request.community.id)
            
        if request.app.id:
            app = AppInfo.get_by_id(request.app.id)
            
        entity = Community.addApp(community, app) if community and app else None
