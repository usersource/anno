__author__ = 'topcircler'

import endpoints
from protorpc import remote
from protorpc import message_types
from protorpc import messages
import logging
from api.utils import put_search_document
from model.anno import Anno
from api.utils import anno_js_client_id

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