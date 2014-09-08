__author__ = 'topcircler'

from google.appengine.ext import ndb

from helper.utils_enum import PlatformType

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
    platform = ndb.StringProperty(choices=[PlatformType.ANDROID, PlatformType.IOS])
    created = ndb.DateTimeProperty(auto_now_add=True)


    @classmethod
    def get(cls, name=None, bundleid=None, platform=None):
        appinfo = None
        if name:
            lc_name = name.lower()
            query = cls.query(ndb.OR(cls.lc_name == lc_name, cls.name == name))
            appinfo = query.get()
        elif bundleid:
            appinfo = cls.query(cls.bundleid == bundleid).get()
        return appinfo

    @classmethod
    def get_unknown(cls):
        apps = cls.query(ndb.AND(cls.bundleid == None, cls.developer == None)).fetch()
        return apps


    @classmethod
    def insert_raw_data(cls, name, platform, bundleid, icon, icon_url, description, version, developer, company_name, app_url):
        lc_name = name.lower()
        entity = cls(name=name, lc_name=lc_name, bundleid=bundleid, icon=icon,
                     icon_url=icon_url, description=description,
                     version=version, developer=developer,
                     company_name=company_name, platform=platform, app_url=app_url)
        entity.put()
        return entity


    @classmethod
    def insert(cls, message):
        entity = cls.insert_raw_data(name=message.name, 
                    platform=getattr(message, 'platform', None),
                    bundleid=getattr(message, 'bundleid', None), icon=message.icon,
                    icon_url=message.icon_url, description=message.description,
                    version=message.version, developer=message.developer,
                    company_name=message.company_name, app_url=message.app_url)
        return entity


    @classmethod
    def update(cls, message):
        entity = None

        # bundleid take precedence
        if getattr(message, 'bundleid', None):
            entity = cls.get(bundleid=message.bundleid)

        # if not found try name
        if not entity:
            platform = getattr(message, 'platform', None)
            entity = cls.get(name=message.name, platform=platform)

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
            entity.bundleid = getattr(message, 'bundleid', None) or entity.bundleid
            entity.platform = getattr(message, 'platform', None) or entity.platform
            entity.put()

        return entity
