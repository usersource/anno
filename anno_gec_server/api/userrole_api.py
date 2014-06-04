__author__ = "rekenerd"

'''
UserRole API implemented using Google Cloud Endpoints.
'''

import logging

import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from api.utils import anno_js_client_id
from model.userrole import UserRole
from model.user import User
from model.community import Community
from message.userrole_message import UserRoleMessage

@endpoints.api(name="userrole", version="1.0", description="User role API",
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class UserRoleApi(remote.Service):
    @endpoints.method(UserRoleMessage, message_types.VoidMessage, path="userrole", http_method="POST", name="userrole.insert")
    def userrole_insert(self, request):
        try:
            if request.user.id:
                user = User.get_by_id(request.user.id)
            elif request.user.user_email:
                user = User.find_user_by_email(request.user.user_email)
                
            community = Community.get_by_id(request.community.id)
                
            if user is None:
                raise endpoints.NotFoundException("No user entity exists.")
            
            if community is None:
                raise endpoints.NotFoundException("No community entity with the id '%s' exists." % request.community.id)
            
            UserRole.insert(user.key, community.key, request.role)
        except Exception as e:
            logging.exception("Exception while inserting user role: %s" % e)
        return message_types.VoidMessage()
