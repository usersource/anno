from apiclient.discovery import build

class SourceServer(object):
   
    DISCOVERY_SERVICE_URL = "http://localhost:8080/_ah/api/discovery/v1/apis/copy_api/v1/rest"
    
    server = build("copy_api", "v1", discoveryServiceUrl=(DISCOVERY_SERVICE_URL))
    items = []
    offset = 0
    limit = 10
           
    def getNextItem(self):
        result = None
               
        if len(self.items) == 0:
            response = self.server.copy().anno_list(offset=self.offset, limit=self.limit).execute()
            if len(response) > 0:
                self.items = response["anno_list"]
                self.offset += self.limit
        
        if len(self.items) != 0:
            result = self.items.pop()
            print "Load image for item: " + result["anno_text"] 
            response = self.server.copy().image(body={"anno_id" : result["id"]}).execute()
            result["image"] = response["image"]
        return result
        