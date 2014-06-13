__author__ = "rekenerd"

import logging
import webapp2

from model.anno import Anno

class UpdateAnnoHandler(webapp2.RequestHandler):
    def get(self):
        self.UpdateAnnoSchema()
        self.response.out.write("Schema migration successfully initiated.")

    def UpdateAnnoSchema(self):
        num_updated = 0
        
        for anno in Anno.query().fetch():
            if anno.community is None:
                anno.community = None
                anno.put()
                num_updated += 1
            
        logging.info("UpdateAnnoSchema complete with %d updates!", num_updated)
