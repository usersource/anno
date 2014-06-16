__author__ = "rekenerd"

import logging
import webapp2

from google.appengine.api import search

from model.anno import Anno

class UpdateAnnoHandler(webapp2.RequestHandler):
    def get(self):
        self.UpdateAnnoSchema()
        self.UpdateAnnoSearchIndexes()
        self.response.out.write("Schema migration successfully initiated.")

    def UpdateAnnoSchema(self):
        num_updated = 0
        
        for anno in Anno.query().fetch():
            if anno.community is None:
                anno.community = None
                anno.put()
                num_updated += 1
            
        logging.info("UpdateAnnoSchema complete with %d updates!", num_updated)

    def UpdateAnnoSearchIndexes(self):
        index = search.Index(name="anno_index")
        start_id = None
        while True:
            resp = index.get_range(start_id=start_id, include_start_object=False)
            if not resp.results:
                break
            for doc in resp:
                fields = [ f for f in doc.fields if f.name != 'community' ] + ([ f for f in doc.fields if f.name == "community" and f.value != None] or [ search.TextField(name="community", value="__open__")])
                anno_document = search.Document(doc_id=doc.doc_id, fields=fields)
                index.put(anno_document)
                start_id = doc.doc_id
