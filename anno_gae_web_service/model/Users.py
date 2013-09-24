'''
Created on Sep 13, 2013

@author: Sergey Gadzhilov
'''
from google.appengine.ext import db

class Users(db.Model):
    
    user_name = db.StringProperty()
    
    def createNewUser(self, userName):
        key = self.put()
        self.user_name = str(key.id()) + "_" + userName
        self.put()
        