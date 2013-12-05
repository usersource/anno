from apiclient.discovery import build
import base64

class SourceServer(object):
   
    DISCOVERY_SERVICE_URL = "https://annoserver-test.appspot.com/_ah/api/discovery/v1/apis/copy_api/v1/rest"
    
    server = build("copy_api", "v1", discoveryServiceUrl=(DISCOVERY_SERVICE_URL))
    items = []
    offset = 0
    limit = 100
           
    def getNextItem(self):
        result = None
               
        if len(self.items) == 0:
            response = self.server.copy().anno_list(offset=self.offset, limit=self.limit).execute()
            if response.has_key("anno_list"):
                self.items = response["anno_list"]
                self.offset += self.limit
        
        if len(self.items) != 0:
            result = self.items.pop()
            result["device_model"] = result["model"]
            del result["model"]
            result["simple_x"] = result["x"]
            del result["x"]
            result["simple_y"] = result["y"]
            del result["y"]
            result["simple_is_moved"] = result["is_moved"]
            del result["is_moved"]
            result["simple_circle_on_top"] = result["is_circle_on_top"]
            del result["is_circle_on_top"]
            result["created"] = result["create_time"]
            del result["create_time"]
            result["creator_id"] = result["user_id"]
            print "creator" + result["creator_id"]
            print "Load image for item: " + result["anno_text"] 
            response = self.server.copy().image(body={"anno_id" : result["id"]}).execute()
            if response.has_key("image"):
                decoded = base64.urlsafe_b64decode(str(response["image"]))
                result["image"] = base64.standard_b64encode(decoded)
        return result
        