from apiclient.discovery import build


class TargetServer(object):
    
    DISCOVERY_SERVICE_URL = "http://localhost:8181/_ah/api/discovery/v1/apis/anno/v1/rest"

    server = build("anno", "v1", discoveryServiceUrl=(DISCOVERY_SERVICE_URL))
    
    def SaveObject(self, item):
        print "Save item: " + item["anno_text"]
        self.server.anno().insert(body=item).execute()