from helper.app_info_helper import StoreTypeEnum, QueryTypeEnum,\
    AppInfoPopulate, PlayStoreCollectionEnum, AppStoreRSSTypeEnum, AppStoreRSSGenreEnum, \
    AppInfoScan

import webapp2
from google.appengine.api import taskqueue

import json
import logging

class AppInfoTaskQueue(object):
    '''
    Wrapper to add Tasks to the Push Queue
    '''
    QUEUE_URL = '/appinfo'

    @classmethod
    def add_update(cls, target_store, query_type, **kargs):
        '''
        Add an update job to the Task Queue
        :param str target_store: Targetted store for this task (Play Store or App Store)
        :param str query_type: The query type on the store (Search, RSS, Web, etc..)
        :param params kargs: Hash of named parameters to send to the target_store's query_type API
        '''
        taskqueue.add(url=cls.QUEUE_URL, params=dict(task='update', target_store=target_store, query_type=query_type, parameters=json.dumps(kargs)))

    @classmethod
    def add_scan(cls, **kargs):
        '''
        Add a scan for unkown Apps job to the Task Queue
        '''
        taskqueue.add(url=cls.QUEUE_URL, params=dict(task='scan', parameters="{}"))


class AppInfoHandler(webapp2.RequestHandler):
    '''
    An AppInfo request handler targeted at scaling App information queries
    '''

    def __init__(self, *args, **kargs):
        super(AppInfoHandler, self).__init__(*args, **kargs)

    def post(self):
        '''
        '''
        task = self.request.get('task')
        target_store = self.request.get('target_store')
        query_type = self.request.get('query_type')
        parameters = self.request.get('parameters')
        # Fail if there is an error here
        parameters = json.loads(parameters)

        if task == 'update':
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

        elif task == 'scan':
            # App Store only for now
            apps = AppInfoScan.scan_for_unknown_apps(platforms=[StoreTypeEnum.APP_STORE], auto_update=False)            
            # Currently the act of Searching for Apps adds them to the Database
            # So nothing more is to be done
            logging.getLogger().debug("Unknown Apps found: %s", apps)

    def get(self):
        self.response.out.write('App Info Service Running...')

        is_cron = self.request.headers.get('X-Appengine-Cron') is not None
        cron_type = self.request.get('cron_type')

        if is_cron and cron_type == 'basic_appinfo_update':
            # Tasks

            ## For now only iOS App Store
            # Page through 240 Apps per Category
            # for page in range(0, 181, 60):
            #     # Fetch and populate Play Store Top Selling Free Apps
            #     AppInfoTaskQueue.add_update(StoreTypeEnum.PLAY_STORE, QueryTypeEnum.FETCH, collection=PlayStoreCollectionEnum.TOP_SELLING_FREE, start=page, num=60)
            #     # Fetch and populate Play Store Top Selling Paid Apps
            #     AppInfoTaskQueue.add_update(StoreTypeEnum.PLAY_STORE, QueryTypeEnum.FETCH, collection=PlayStoreCollectionEnum.TOP_SELLING_PAID, start=page, num=60)
            #     # Fetch and populate Play Store Top Grossing Apps
            #     AppInfoTaskQueue.add_update(StoreTypeEnum.PLAY_STORE, QueryTypeEnum.FETCH, collection=PlayStoreCollectionEnum.TOP_GROSSING, start=page, num=60)
            #     # Fetch and populate Play Store Top Selling New Free Apps
            #     AppInfoTaskQueue.add_update(StoreTypeEnum.PLAY_STORE, QueryTypeEnum.FETCH, collection=PlayStoreCollectionEnum.TOP_SELLING_NEW_FREE, start=page, num=60)
            #     # Fetch and populate Play Store Top Selling New Paid Apps
            #     AppInfoTaskQueue.add_update(StoreTypeEnum.PLAY_STORE, QueryTypeEnum.FETCH, collection=PlayStoreCollectionEnum.TOP_SELLING_NEW_PAID, start=page, num=60)

            # Fetch and populate App Store Top Apps for each genre in each category
            for genre in ['ALL']: #dir(AppStoreRSSGenreEnum):
                # Only valid enum values
                if callable(getattr(AppStoreRSSGenreEnum, genre)) or genre.startswith('__'): continue
                AppInfoTaskQueue.add_update(StoreTypeEnum.APP_STORE, QueryTypeEnum.FETCH, collection=AppStoreRSSTypeEnum.TOP_FREE, genre_id=getattr(AppStoreRSSGenreEnum, genre))
                AppInfoTaskQueue.add_update(StoreTypeEnum.APP_STORE, QueryTypeEnum.FETCH, collection=AppStoreRSSTypeEnum.TOP_GROSSING, genre_id=getattr(AppStoreRSSGenreEnum, genre))
                AppInfoTaskQueue.add_update(StoreTypeEnum.APP_STORE, QueryTypeEnum.FETCH, collection=AppStoreRSSTypeEnum.TOP_PAID, genre_id=getattr(AppStoreRSSGenreEnum, genre))
                AppInfoTaskQueue.add_update(StoreTypeEnum.APP_STORE, QueryTypeEnum.FETCH, collection=AppStoreRSSTypeEnum.NEW_APPS, genre_id=getattr(AppStoreRSSGenreEnum, genre))
                AppInfoTaskQueue.add_update(StoreTypeEnum.APP_STORE, QueryTypeEnum.FETCH, collection=AppStoreRSSTypeEnum.NEW_FREE, genre_id=getattr(AppStoreRSSGenreEnum, genre))
                AppInfoTaskQueue.add_update(StoreTypeEnum.APP_STORE, QueryTypeEnum.FETCH, collection=AppStoreRSSTypeEnum.NEW_PAID, genre_id=getattr(AppStoreRSSGenreEnum, genre))

        elif is_cron and cron_type == "basic_appinfo_scan":
            # Scan for unknown Apps
            AppInfoTaskQueue.add_scan()

