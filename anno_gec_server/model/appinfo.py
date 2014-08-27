__author__ = 'topcircler'

import endpoints
from google.appengine.ext import ndb

from message.appinfo_message import AppInfoMessage


class AppInfo(ndb.Model):
    """
    This class represents a 3rd party app information.
    """
    name = ndb.StringProperty(required=True)
    lc_name = ndb.StringProperty()
    bundleid = ndb.StringProperty()
    icon = ndb.BlobProperty()
    icon_url = ndb.StringProperty()
    description = ndb.TextProperty()
    version = ndb.StringProperty()
    developer = ndb.StringProperty()
    company_name = ndb.StringProperty()
    app_url = ndb.StringProperty()
    created = ndb.DateTimeProperty(auto_now_add=True)


    @classmethod
    def get(cls, name):
        appinfo = None
        if name:
            lc_name = name.lower()
            appinfo = cls.query(ndb.OR(cls.lc_name == lc_name, cls.name == name)).get()
        return appinfo


    @classmethod
    def insert_raw_data(cls, name, bundleid, icon, icon_url, description, version, developer, company_name, app_url):
        lc_name = name.lower()
        entity = cls(name=name, lc_name=lc_name, bundleid=bundleid, icon=icon,
                     icon_url=icon_url, description=description,
                     version=version, developer=developer,
                     company_name=company_name, app_url=app_url)
        entity.put()
        return entity


    @classmethod
    def insert(cls, message):
        entity = cls.insert_raw_data(name=message.name, bundleid=getattr(message, 'bundleid', None), icon=message.icon,
                     icon_url=message.icon_url, description=message.description,
                     version=message.version, developer=message.developer,
                     company_name=message.company_name, app_url=message.app_url)
        return entity


    @classmethod
    def update(cls, message):
        entity = cls.get(name=message.name)

        if entity is None:
            entity = cls.insert(message)
        else:
            entity.icon = message.icon or entity.icon
            entity.icon_url = message.icon_url or entity.icon_url
            entity.description = message.description or entity.description
            entity.version = message.version or entity.version
            entity.developer = message.developer or entity.developer
            entity.company_name = message.company_name or entity.company_name
            entity.app_url = message.app_url or entity.app_url
            entity.bundleid = message.bundleid or entity.bundleid
            entity.put()

        return entity
