'''
Created on Jun 13, 2013

@author: sergey
'''
import webapp2
import logging
import json
from model.FeedbackComment import FeedbackComment
from datetime import datetime
from utils.AnnoJsonEncoder import AnnoJsonEncoder

class AnnoSync(webapp2.RequestHandler):
    
    JSON_REQUEST_PARAM_NAME = "jsonData"
    JSON_UPDATED_OBJECT = "updatedObjects"
    JSON_TIMESTAMP = "lastUpdateDate"
    
    JSON_REQUEST_TYPE = "request_type"
    JSON_REQUEST_TYPE_KEYS = "generateKeys"
    JSON_REQUEST_TYPE_UPDATE =  "updateData"
    JSON_REQUEST_TYPE_SERVER_DATA = "getServerData"
    
    JSON_KEYS_COUNT = "keys_count";
    JSON_OBJECTS_KEYS = "objectsKeys";
    
    def get(self):
        self.response.out.write(self.proceedRequest(self.request))
        
    def post(self):
        self.response.out.write(self.proceedRequest(self.request))
        
    def proceedRequest(self, request):
        requestData = request.get(AnnoSync.JSON_REQUEST_PARAM_NAME)
        answer = ''
        logging.info("Recived json string" + requestData);
        
        if(None != requestData and requestData != ''):
            recivedJson  = json.loads(requestData)

            if recivedJson[AnnoSync.JSON_REQUEST_TYPE] == AnnoSync.JSON_REQUEST_TYPE_KEYS:
                self.generateKeys(recivedJson)
            elif recivedJson[AnnoSync.JSON_REQUEST_TYPE] ==  AnnoSync.JSON_REQUEST_TYPE_UPDATE:
                self.updateData(recivedJson)
            elif recivedJson[AnnoSync.JSON_REQUEST_TYPE] ==  AnnoSync.JSON_REQUEST_TYPE_SERVER_DATA:
                self.getServerData(recivedJson)

            recivedJson[AnnoSync.JSON_TIMESTAMP] = datetime.now().strftime("%Y-%m-%d %H:%M:%S:%f")
            answer = json.dumps(recivedJson, cls = AnnoJsonEncoder)
            
        logging.info("Server answer" + answer )
        return answer
    
    def generateKeys(self, data):
        comment = FeedbackComment()
        data[AnnoSync.JSON_OBJECTS_KEYS] = comment.generateKeys(data[AnnoSync.JSON_KEYS_COUNT])
        
        
    def updateData(self, data):
        comment = FeedbackComment()
        comment.createComment(data[AnnoSync.JSON_UPDATED_OBJECT])
        data[AnnoSync.JSON_UPDATED_OBJECT] = []

    def getServerData(self, data):
        data[AnnoSync.JSON_UPDATED_OBJECT] = []
        serverObjects = self.getServerObjects(data)
        for item in serverObjects: 
            data[AnnoSync.JSON_UPDATED_OBJECT].append(item.copy())
       
            
    def getServerObjects(self, data):
        comment = FeedbackComment()
        return comment.getCommentsAfterDate(data[AnnoSync.JSON_TIMESTAMP])
        
    
    
    
   
    