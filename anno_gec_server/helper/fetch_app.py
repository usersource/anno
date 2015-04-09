import logging
import json

from urllib2 import urlopen
from urllib import quote

from message.appinfo_message import AppInfoMessage, AppInfoListMessage

class AppInfoGetter(object):
    ITUNES_SEARCH_URL = 'https://itunes.apple.com/search?term={term}&media=software&limit=50'

    @classmethod
    def search(cls, term):
        url = cls.ITUNES_SEARCH_URL.format(term=quote(term))
        data = None

        try:
            data = urlopen(url).read()
        except URLError as e:
            logging.getLogger().exception("Error in getting app from store: %s", e.read())

        return cls.parse(data)

    @classmethod
    def parse(cls, apps):
        appinfo_list = []
        apps = json.loads(apps) if apps else []

        for app in apps.get('results', []):
            appinfo_message = AppInfoMessage(
                name=app.get('trackName'),
                bundleid=app.get('bundleId'),
                icon=None,
                icon_url=app.get('artworkUrl60'),
                description=app.get('description'),
                version=app.get('version'),
                developer=app.get('artistName'),
                company_name=app.get('artistName'),
                app_url=app.get('trackViewUrl')
            )

            appinfo_list.append(appinfo_message)

        return appinfo_list
