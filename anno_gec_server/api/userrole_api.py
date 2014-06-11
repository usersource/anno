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
from message.userrole_message import UserRoleMessage
from message.common_message import ResponseMessage

@endpoints.api(name="userrole", version="1.0", description="User role API",
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class UserRoleApi(remote.Service):

    @endpoints.method(UserRoleMessage, ResponseMessage, path="userrole", http_method="POST", name="userrole.insert")
    def userrole_insert(self, request):
        resp = UserRole.insert(request.user, request.community, request.role)
        return ResponseMessage(success=True if resp else False)
