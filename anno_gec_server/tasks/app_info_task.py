from helper.app_info_helper import StoreTypeEnum, QueryTypeEnum,\
    AppInfoPopulate, PlayStoreCollectionEnum, AppStoreRSSTypeEnum, AppStoreRSSGenreEnum

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

        is_cron = self.request.headers.get('X-Appengine-Cron') is not None

        if is_cron and self.request.get('cron_type') == 'basic_weekly':
            # Tasks
            # Page through 240 Apps per Category
            for page in range(0, 181, 60):
                # Fetch and populate Play Store Top Selling Free Apps
                AppInfoTaskQueue.add(StoreTypeEnum.PLAY_STORE, QueryTypeEnum.FETCH, collection=PlayStoreCollectionEnum.TOP_SELLING_FREE, start=page, num=60)
                # Fetch and populate Play Store Top Selling Paid Apps
                AppInfoTaskQueue.add(StoreTypeEnum.PLAY_STORE, QueryTypeEnum.FETCH, collection=PlayStoreCollectionEnum.TOP_SELLING_PAID, start=page, num=60)
                # Fetch and populate Play Store Top Grossing Apps
                AppInfoTaskQueue.add(StoreTypeEnum.PLAY_STORE, QueryTypeEnum.FETCH, collection=PlayStoreCollectionEnum.TOP_GROSSING, start=page, num=60)
                # Fetch and populate Play Store Top Selling New Free Apps
                AppInfoTaskQueue.add(StoreTypeEnum.PLAY_STORE, QueryTypeEnum.FETCH, collection=PlayStoreCollectionEnum.TOP_SELLING_NEW_FREE, start=page, num=60)
                # Fetch and populate Play Store Top Selling New Paid Apps
                AppInfoTaskQueue.add(StoreTypeEnum.PLAY_STORE, QueryTypeEnum.FETCH, collection=PlayStoreCollectionEnum.TOP_SELLING_NEW_PAID, start=page, num=60)

            # Fetch and populate App Store Top Apps for each genre in each category
            for genre in ['ALL']: #dir(AppStoreRSSGenreEnum):
                # Only valid enum values
                if callable(getattr(AppStoreRSSGenreEnum, genre)) or genre.startswith('__'): continue
                AppInfoTaskQueue.add(StoreTypeEnum.APP_STORE, QueryTypeEnum.FETCH, collection=AppStoreRSSTypeEnum.TOP_FREE, genre_id=getattr(AppStoreRSSGenreEnum, genre))
                AppInfoTaskQueue.add(StoreTypeEnum.APP_STORE, QueryTypeEnum.FETCH, collection=AppStoreRSSTypeEnum.TOP_GROSSING, genre_id=getattr(AppStoreRSSGenreEnum, genre))
                AppInfoTaskQueue.add(StoreTypeEnum.APP_STORE, QueryTypeEnum.FETCH, collection=AppStoreRSSTypeEnum.TOP_PAID, genre_id=getattr(AppStoreRSSGenreEnum, genre))
                AppInfoTaskQueue.add(StoreTypeEnum.APP_STORE, QueryTypeEnum.FETCH, collection=AppStoreRSSTypeEnum.NEW_APPS, genre_id=getattr(AppStoreRSSGenreEnum, genre))
                AppInfoTaskQueue.add(StoreTypeEnum.APP_STORE, QueryTypeEnum.FETCH, collection=AppStoreRSSTypeEnum.NEW_FREE, genre_id=getattr(AppStoreRSSGenreEnum, genre))
                AppInfoTaskQueue.add(StoreTypeEnum.APP_STORE, QueryTypeEnum.FETCH, collection=AppStoreRSSTypeEnum.NEW_PAID, genre_id=getattr(AppStoreRSSGenreEnum, genre))

