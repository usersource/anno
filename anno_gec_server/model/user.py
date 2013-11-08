__author__ = 'topcircler'

from google.appengine.ext import ndb


class User(ndb.Model):
    """
    Represents user entity.
    """
    user_id = ndb.StringProperty()
    user_email = ndb.StringProperty()

    @classmethod
    def find_user_by_email(cls, email):
        return cls.query(User.user_email == email).get()

    @classmethod
    def insert_user(cls, email):
        user = User(user_id=email, user_email=email)
        user.put()
        return user