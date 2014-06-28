__author__ = "rekenerd"

'''
AppInfo API implemented using Google Cloud Endpoints.
'''

import logging

import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from settings import anno_js_client_id
from message.appinfo_message import AppInfoMessage
from message.common_message import ResponseMessage
from model.appinfo import AppInfo

@endpoints.api(name="appinfo", version="1.0", description="AppInfo API",
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class AppInfoApi(remote.Service):

    @endpoints.method(AppInfoMessage, ResponseMessage, path="appinfo", http_method="POST", name="appinfo.insert")
    def appinfo_insert(self, request):
        resp = AppInfo.insert(request)
        return ResponseMessage(success=True if resp else None)
