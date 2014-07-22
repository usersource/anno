__author__ = 'topcircler'

import logging
from operator import itemgetter

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

        anno_key_list = [ usersource.anno for usersource in userannostate_list ]
        anno_list = ndb.get_multi(anno_key_list)
        favorite_apps_dict = {}

        for anno in anno_list:
            if anno:
                app = anno.app.get() if anno.app else None
                app_name = app.name if app else anno.app_name
                app_icon_url = app.icon_url if app else ""
                app_version = app.version if app else anno.app_version

                if app_name in favorite_apps_dict.keys():
                    favorite_apps_dict[app_name]["count"] += 1
                else:
                    favorite_apps_dict[app_name] = dict(name=app_name, icon_url=app_icon_url,
                                                        version=app_version, count=1)

        # favorite_apps = [ value for key, value in favorite_apps_dict.iteritems() ]
        favorite_apps = sorted(favorite_apps_dict.values(), key=itemgetter("count"), reverse=True)

        favorite_apps_list = []
        for app in favorite_apps:
            app_message = UserFavoriteApp(name=app.get("name"), icon_url=app.get("icon_url"), version=app.get("version"))
            favorite_apps_list.append(app_message)

        return favorite_apps_list

    def to_message(self):
        return UserMessage(id=self.key.id(), user_email=self.user_email, display_name=self.display_name,
                           auth_source=self.auth_source, device_id=self.device_id, device_type=self.device_type)
