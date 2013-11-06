__author__ = 'topcircler'

import endpoints
import logging
import webapp2
from model.anno import Anno


class ImageHandler(webapp2.RequestHandler):
    def get(self):
        """
        handle request for screenshot.
        """
        anno_id = self.request.get('anno_id')
        if anno_id is None or anno_id == '':
            self.response.set_status(400)
            self.response.out.write(u'anno_id parameter is required.')
        else:
            anno = Anno.get_by_id(long(anno_id))
            if anno is None:
                self.response.set_status(400)
                self.response.out.write('No anno entity with the id "%s" exists.' % anno_id)
            elif anno.image is None:
                self.response.set_status(404)
                self.response.out.write("This anno doesn't contain screenshot")
            else:
                self.response.out.write(anno.image)
