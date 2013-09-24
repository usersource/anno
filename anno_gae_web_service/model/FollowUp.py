'''
Created on Aug 30, 2013

@author: sergey
'''

from google.appengine.ext import db
from model.AnnoSyncEntity import AnnoSyncEntity
from model.FeedbackComment import FeedbackComment


class FollowUp(AnnoSyncEntity):
    
    comment = db.StringProperty()
    Feedback_key = db.ReferenceProperty(FeedbackComment, 
                                        collection_name='followups')
    
    def AddNewFollowUp(self, data):
        result = {}
        try:
            self.Feedback_key = db.get(data["feedback_key"])
            if self.Feedback_key != None:
                result["success"] = "true"
                self.comment = data["comment"]
                self.user_id = db.Key.from_path('Users', int(data["user_id"]))
                self.put()
            else:
                result["success"] = "false"
                result["message"] = "Feedback does not exists"
        except:
            result["success"] = "false"
            result["message"] = "Unknown exception in FollowUp.AddNew"
        return result        