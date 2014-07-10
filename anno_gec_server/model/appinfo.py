__author__ = 'topcircler'

import endpoints
from google.appengine.ext import ndb

from message.appinfo_message import AppInfoMessage


class AppInfo(ndb.Model):
    """
    This class represents a 3rd party app information.
    """
    name = ndb.StringProperty(required=True)
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
        return cls.query(cls.name == name).get() if name else None


    @classmethod
    def insert(cls, message):
        entity = cls(name=message.name, icon=message.icon, icon_url=message.icon_url,
                     description=message.description, version=message.version,
                     developer=message.developer, company_name=message.company_name,
                     app_url=message.app_url)
        entity.put()
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
            entity.put()

        return entity
