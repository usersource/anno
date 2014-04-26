__author__ = 'topcircler'

from google.appengine.ext import ndb
import endpoints
import uuid

from message.appinfo_message import AppInfoMessage

class AppInfo(ndb.Model):
    """
    This class represents a 3rd party app information.
    """
    app_key = ndb.StringProperty(required=True)
    app_name = ndb.StringProperty(required=True)
    private_data = ndb.BooleanProperty(required=True)
    created = ndb.DateTimeProperty(required=True, auto_now_add=True)
    # below fields are optional.
    contact_email = ndb.StringProperty()  # 3rd-party app developer contact email.
    company_name = ndb.StringProperty(required=True)  # 3rd-party app company.
    app_urls = ndb.StringProperty() # 3rd-party app store urls.


    @classmethod
    def get_appinfo(cls, message):
        app_name = message.app_name
        query = cls.query().filter(cls.app_name == app_name)
        appinfo = None
        count = 0
        for item in query:
            ++count
            if count == 2:
                raise endpoints.ServiceException("More than one app name(%s) exists." % app_name)
            appinfo = item
        return appinfo

    @classmethod
    def insert_appinfo(cls, message):
        app_key = str(uuid.uuid4())
        entity = cls(app_key=app_key, app_name=message.app_name,
                     private_data=message.private_data, contact_email=message.contact_email,
                     company_name=message.company_name, app_urls=message.app_urls)
        entity.put()
        return entity

    def to_message(self):
        return AppInfoMessage(app_key=self.app_key, app_name=self.app_name, company_name=self.company_name,
                              private_data=self.private_data, created=self.created,
                              contact_email=self.contact_email, app_urls=self.app_urls)