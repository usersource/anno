__author__ = "rekenerd"

'''
AppInfo API implemented using Google Cloud Endpoints.
'''

import logging

import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from helper.settings import anno_js_client_id
from helper.utils import getAppInfo
from message.appinfo_message import AppInfoMessage
from message.common_message import ResponseMessage
from model.appinfo import AppInfo


@endpoints.api(name="appinfo", version="1.0", description="AppInfo API",
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class AppInfoApi(remote.Service):

    appinfo_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        team_key=messages.StringField(2, required=True)
    )

    @endpoints.method(AppInfoMessage, ResponseMessage, path="appinfo/insert",
                      http_method="POST", name="appinfo.insert")
    def insert_appinfo(self, request):
        resp = AppInfo.insert(request)
        return ResponseMessage(success=True if resp else None)


    @endpoints.method(AppInfoMessage, ResponseMessage, path="appinfo/update",
                      http_method="POST", name="appinfo.update")
    def update_appinfo(self, request):
        resp = AppInfo.update(request)
        return ResponseMessage(success=True if resp else None)

    @endpoints.method(appinfo_resource_container, AppInfoMessage, path="appinfo/get",
                      http_method="GET", name="appinfo.get")
    def get_appinfo(self, request):
        community_app =  getAppInfo(team_key=request.team_key)
        return AppInfoMessage(name=community_app.name, icon_url=community_app.icon_url)
