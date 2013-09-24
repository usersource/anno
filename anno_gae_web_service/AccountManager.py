'''
Created on Sep 12, 2013

@author: sergey
'''

import webapp2
import logging
import json
from model.Users import Users
from utils.AnnoJsonEncoder import AnnoJsonEncoder

class AccountManager(webapp2.RequestHandler):
    
    JSON_REQUEST = "jsonData"
    
    JSON_TYPE = "request_type"
    JSON_TYPE_CREATE_USER = "create_user"
    
    JSON_USER_NAME = "user_name"
    
    def get(self):
        self.response.out.write(self.proceedRequest());
        
    def post(self):
        self.response.out.write(self.proceedRequest());
        
    def proceedRequest(self):
        response = {}
        
        jsonRequest = self.request.get(AccountManager.JSON_REQUEST)
        
        if jsonRequest != None and jsonRequest != "":
            logging.info("Request = " + jsonRequest)
            jsonData = json.loads(jsonRequest)
            response = self.proceedJson(jsonData)  
        
        logging.info("Response = " + json.dumps(response, cls=AnnoJsonEncoder))
        
        return json.dumps(response, cls=AnnoJsonEncoder)
    
    
    def proceedJson(self, data):
        result = {}
        if data[AccountManager.JSON_TYPE] == AccountManager.JSON_TYPE_CREATE_USER:
            user = Users()
            user.createNewUser(data[AccountManager.JSON_USER_NAME])
            result["user_id"] = user.key().id()
            result["user_name"] = user.user_name
            return result
            
        