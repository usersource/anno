from helper.app_info_helper import StoreTypeEnum, QueryTypeEnum, AppInfoPopulate

import webapp2
from google.appengine.api import taskqueue

import json

class AppInfoTaskQueue(object):
    '''
    Wrapper to add Tasks to the Push Queue
    '''
    QUEUE_URL = '/appinfo'

    @classmethod
    def add(cls, target_store, query_type, **kargs):
        '''
        Add a job to the Task Queue
        :param str target_store: Targetted store for this task (Play Store or App Store)
        :param str query_type: The query type on the store (Search, RSS, Web, etc..)
        :param params kargs: Hash of named parameters to send to the target_store's query_type API
        '''
        taskqueue.add(url=cls.QUEUE_URL, params=dict(target_store=target_store, query_type=query_type, parameters=json.dumps(kargs)))

class AppInfoHandler(webapp2.RequestHandler):
    '''
    An AppIfno request handler targeted at scaling App information queries
    '''

    def __init__(self, *args, **kargs):
        super(AppInfoHandler, self).__init__(*args, **kargs)

    def post(self):
        '''
        '''
        target_store = self.request.get('target_store')
        query_type = self.request.get('query_type')
        parameters = self.request.get('parameters')
        # Fail if there is an error here
        parameters = json.loads(parameters)

        if target_store == StoreTypeEnum.APP_STORE:
            if query_type == QueryTypeEnum.FETCH:
                AppInfoPopulate.app_store_fetch(**parameters)
            elif query_type == QueryTypeEnum.SEARCH:
                AppInfoPopulate.app_store_search(**parameters)

        elif target_store == StoreTypeEnum.PLAY_STORE:
            if query_type == QueryTypeEnum.FETCH:
                AppInfoPopulate.play_store_fetch(**parameters)
            elif query_type == QueryTypeEnum.SEARCH:
                AppInfoPopulate.play_store_search(**parameters)

    def get(self):
        self.response.out.write('App Info Service Running...')