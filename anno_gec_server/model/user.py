__author__ = 'topcircler'

from google.appengine.ext import ndb

from message.user_message import UserMessage


class User(ndb.Model):
    """
    Represents user entity.
    """
    user_email = ndb.StringProperty()  # this field should be unique.
    display_name = ndb.StringProperty()  # this field should be unique.
    password = ndb.StringProperty()
    auth_source = ndb.StringProperty()  # "Anno" or "Google". If not "Anno", then no password is stored.
    device_id = ndb.StringProperty()

    @classmethod
    def find_user_by_email(cls, email):
        return cls.query(User.user_email == email).get()

    @classmethod
    def find_user_by_display_name(cls, display_name):
        return cls.query(User.display_name == display_name).get()

    @classmethod
    def insert_user(cls, email):
        user = User(display_name=email, user_email=email, auth_source='Google')
        user.put()
        return user

    @classmethod
    def insert_normal_user(cls, email, username, password):
        user = User(user_email=email, display_name=username, password=password, auth_source="Anno")
        user.put()
        return user

    @classmethod
    def insert_user(cls, email, username, auth_source):
        user = User(user_email=email, display_name=username, auth_source=auth_source)
        user.put()
        return user

    @classmethod
    def authenticate(cls, email, password):
        query = User.query().filter(cls.user_email == email).filter(cls.password == password)
        return query.get() is not None

    def to_message(self):
        return UserMessage(id=self.key.id(), user_email=self.user_email, display_name=self.display_name,
                           auth_source=self.auth_source, device_id=self.device_id)
