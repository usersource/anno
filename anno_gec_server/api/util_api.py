__author__ = 'topcircler'

import logging

import endpoints
from protorpc import remote
from protorpc import message_types

from api.utils import put_search_document
from model.anno import Anno
from model.appinfo import AppInfo
from settings import anno_js_client_id
from api.utils import is_empty_string
from message.appinfo_message import AppInfoMessage


@endpoints.api(name='util', version='1.0', description='Util API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class UtilApi(remote.Service):
    """
    Class which defines Util API v1.
    """

    @endpoints.method(message_types.VoidMessage, message_types.VoidMessage, path='util.init_index_document',
                      http_method='POST', name='util.migrate_index_document')
    def init_index_document(self, request):
        """
        Exposes an API endpoint to insert search document for legacy documents.
        """
        for anno in Anno.query():
            logging.info("generating search document for anno(%s)." % anno.key.id())
            put_search_document(anno.generate_search_document())
        return message_types.VoidMessage()


    @endpoints.method(AppInfoMessage, AppInfoMessage, path='util.generate_appkey', http_method='POST', name='util.generate_appkey')
    def generate_appkey(self, request):
        """
        Exposes an API endpoint to generate an app key for a register 3rd-party app developer.
        """
        app_name = request.app_name
        if is_empty_string(app_name):
            raise endpoints.BadRequestException('app_name is required.')
        company_name = request.company_name
        if is_empty_string(company_name):
            raise endpoints.BadRequestException('company_name is required.')

        appinfo = AppInfo.get_appinfo(request)
        exists = (appinfo is not None)
        if not exists:
            appinfo = AppInfo.insert_appinfo(request)
        appinfo_message = appinfo.to_message()
        appinfo_message.is_registered = exists
        return appinfo_message
