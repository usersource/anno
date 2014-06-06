__author__ = "rekenerd"

from google.appengine.ext import ndb

from model.appinfo import AppInfo

class Community(ndb.Model):
    name = ndb.StringProperty(required=True)
    description = ndb.StringProperty()
    welcome_msg = ndb.StringProperty()
    type = ndb.StringProperty(choices=["private", "public"], required=True)
    apps = ndb.KeyProperty(kind=AppInfo, repeated=True)
    created = ndb.DateTimeProperty(auto_now_add=True)
    
    @classmethod
    def insert(cls, message):
        entity = cls(name=message.name, description=message.description,
                     welcome_msg=message.welcome_msg, type=message.type)
        entity.put()
        return entity
    
    @classmethod
    def delete(cls, community):
        community.key.delete()
    
    @classmethod
    def addApp(cls, community, app):
        community.apps.append(app.key)
        community.put()
        return community
