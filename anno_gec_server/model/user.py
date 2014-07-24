__author__ = 'topcircler'

import logging

from google.appengine.ext import ndb

from message.user_message import UserMessage
from message.appinfo_message import UserFavoriteApp


class User(ndb.Model):
    """
    Represents user entity.
    """
    user_email = ndb.StringProperty()  # this field should be unique.
    display_name = ndb.StringProperty()  # this field should be unique.
    password = ndb.StringProperty()
    auth_source = ndb.StringProperty()  # "Anno" or "Google". If not "Anno", then no password is stored.
    device_id = ndb.StringProperty()
    device_type = ndb.StringProperty(choices=["iOS", "Android"])

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

    @classmethod
    def list_favorite_apps(cls, user_key):
        from model.userannostate import UserAnnoState
        userannostate_list = UserAnnoState.list_by_user(user_key)

        anno_key_list = [ userannostate.anno for userannostate in userannostate_list if userannostate.anno is not None ]
        anno_key_list = list(set(anno_key_list))
        anno_list = ndb.get_multi(anno_key_list)

        app_key_list = [ anno.app for anno in anno_list if anno.app is not None ]
        app_key_dict = { app_key : app_key_list.count(app_key) for app_key in app_key_list }
        app_key_list = list(set(app_key_list))
        app_key_list = sorted(app_key_list, key=lambda x: app_key_dict.get(x), reverse=True)
        app_list = ndb.get_multi(app_key_list)

        favorite_apps_list = []
        for app in app_list:
            if app:
                app_message = UserFavoriteApp(name=app.name, icon_url=(app.icon_url or ""), version=(app.version or ""))
                favorite_apps_list.append(app_message)

        return favorite_apps_list

    def to_message(self):
        return UserMessage(id=self.key.id(), user_email=self.user_email, display_name=self.display_name,
                           auth_source=self.auth_source, device_id=self.device_id, device_type=self.device_type)
