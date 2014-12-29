import logging

from google.appengine.ext import ndb

from message.user_message import UserMessage
from message.appinfo_message import UserFavoriteApp
from helper.utils_enum import PlatformType
from helper.utils_enum import AuthSourceType


class User(ndb.Model):
    """
    Represents user entity.
    """
    user_email = ndb.StringProperty()  # this field should be unique.
    display_name = ndb.StringProperty()  # this field should be unique.
    password = ndb.StringProperty()
    image_url = ndb.StringProperty()
    auth_source = ndb.StringProperty(choices=[AuthSourceType.ANNO, AuthSourceType.GOOGLE, AuthSourceType.PLUGIN])  # If "Anno" then password is required.
    device_id = ndb.StringProperty()
    device_type = ndb.StringProperty(choices=[PlatformType.IOS, PlatformType.ANDROID])
    account_type = ndb.StringProperty()

    @classmethod
    def find_user_by_email(cls, email, team_key=None):
        query = cls.query().filter(cls.user_email == email)

        if team_key:
            query = query.filter(cls.account_type == team_key)
            query = query.filter(cls.auth_source == AuthSourceType.PLUGIN)
        else:
            query = query.filter(cls.auth_source != AuthSourceType.PLUGIN)

        return query.get()

    @classmethod
    def get_all_user_by_email(cls, email, password, team_key=None):
        query = cls.query().filter(ndb.AND(cls.user_email == email,
                                           cls.password == password,
                                           cls.auth_source == AuthSourceType.PLUGIN))

        if team_key:
            query = query.filter(cls.account_type == team_key)

        return query.get()

    @classmethod
    def find_user_by_display_name(cls, display_name):
        return cls.query(User.display_name == display_name).get()

    @classmethod
    def insert_user(cls, email, username=None, password=None, auth_source=None, account_type=None, image_url=None):
        username = username or email.split('@')[0]

        if password:
            auth_source = AuthSourceType.ANNO
        elif account_type:
            auth_source = AuthSourceType.PLUGIN
        else:
            auth_source = AuthSourceType.GOOGLE

        user = User(user_email=email, display_name=username, password=password,
                    auth_source=auth_source, account_type=account_type,
                    image_url=image_url)
        user.put()
        return user

    @classmethod
    def update_user(cls, user=None, email=None, username=None, image_url=None, account_type=None):
        if not user and email:
            user = cls.find_user_by_email(email, account_type)

        if user:
            user.display_name = username or user.display_name
            user.image_url = image_url or user.image_url
            user.put()

        return user

    @classmethod
    def authenticate(cls, email, password):
        query = User.query().filter(cls.user_email == email).filter(cls.password == password)
        return query.get() is not None

    @classmethod
    def list_favorite_apps(cls, user_key):
        # We are using "query" on key for getting anno data instead of "get" or "get_multi"
        # Getting anno using "query" is more memory efficient than using "get" or "get_multi",
        # we don't know why.
        # Getting anno using "query" also create index for this.

        from model.userannostate import UserAnnoState
        from model.anno import Anno

        userannostate_list = UserAnnoState.list_by_user(user_key, 50)
        anno_key_list = [ userannostate.anno for userannostate in userannostate_list if userannostate.anno is not None ]

        if len(anno_key_list):
            anno_list = Anno.query(ndb.AND(Anno.key.IN(anno_key_list),
                                           Anno.app != None)
                                   )\
                            .fetch(projection=[Anno.app])
            app_key_list = [ anno.app for anno in anno_list ]
            app_key_list = sorted(app_key_list, key=app_key_list.count, reverse=True)
            unique_app_key_list = []
            [ unique_app_key_list.append(app_key) for app_key in app_key_list if app_key not in unique_app_key_list ]
            app_list = ndb.get_multi(unique_app_key_list)
        else:
            app_list = []

        favorite_apps_list = []
        for app in app_list:
            if app:
                app_message = UserFavoriteApp(name=app.name, icon_url=(app.icon_url or ""), version=(app.version or ""))
                favorite_apps_list.append(app_message)

        return favorite_apps_list

    def to_message(self):
        return UserMessage(id=self.key.id(), user_email=self.user_email, display_name=self.display_name,
                           auth_source=self.auth_source, device_id=self.device_id, device_type=self.device_type)
