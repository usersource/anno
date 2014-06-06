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
    contact_email = ndb.StringProperty()
    company_name = ndb.StringProperty()
    app_url = ndb.StringProperty()
    created = ndb.DateTimeProperty(auto_now_add=True)

    @classmethod
    def getAppInfo(cls, name=None):
        if name:
            return cls.query(cls.name == name).get()
        else:
            return None

    @classmethod
    def insert(cls, message):
        entity = cls(name=message.name, version=message.version)
        entity.put()
        return entity
