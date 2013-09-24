'''
Created on Aug 31, 2013

@author: sergey
'''

import webapp2
from google.appengine.api import users
from model.FeedbackComment import FeedbackComment

class Test(webapp2.RequestHandler):
    
    def get(self):
        self.response.out.write(self.proceedRequest())
        
    def post(self):
        self.response.out.write(self.proceedRequest())
        
    def proceedRequest(self):
        item = {}
        for iter in range(20):
            item["screenshot_key"] =  "screenshot_key" + str(iter)
            item["comment"] =  "comment" + str(iter)
            item["x"] = "100"
            item["y"] = "200"
            item["direction"] = "direction" + str(iter)
            item["image"] = "image1" + str(iter)
            item["app_version"] = "app_version1" + str(iter)
            item["app_name"] = "app_name" + str(iter)
            item["isMoved"] = iter
            item["level"] = iter
            item["os_version"] = "os version1" + str(iter)
            item["anno_type"] = "type1" + str(iter)
            item["model"] = "model1" + str(iter)
            com = FeedbackComment(user = users.get_current_user(), userId = users.get_current_user().user_id())
            com.addNewComment(item)
                