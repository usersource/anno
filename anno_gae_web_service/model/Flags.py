'''
Created on Aug 30, 2013

@author: sergey
'''

from google.appengine.ext import db
from model.AnnoSyncEntity import AnnoSyncEntity
from model.FeedbackComment import FeedbackComment

class Flags(AnnoSyncEntity):
    
    feedback_key = db.ReferenceProperty(FeedbackComment,
                                        collection_name='flags')
    
    def AddNewFlag(self, data):
        result = {}
        try:
            self.feedback_key = db.get(data["feedback_key"])
            if self.feedback_key != None:
                result["success"] = "true"
                self.user_id = db.Key.from_path('Users', int(data["user_id"]))
                self.put()
            else:
                result["success"] = "false"
                result["message"] = "Feedback does not exists"
        except:
            result["success"] = "false"
            result["message"] = "Unknown exception in Flags.AddNewFlag"
        return result 
