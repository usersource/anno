'''
Created on Jun 13, 2013

@author: sergey
'''
from google.appengine.ext import db
from Users import Users

class AnnoSyncEntity(db.Model):
    '''
    classdocs
    '''
    updateTimestamp = db.DateTimeProperty(auto_now = True)
    user_id = db.ReferenceProperty(Users)
    
        