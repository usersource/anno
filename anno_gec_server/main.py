__author__ = 'topcircler'

import webapp2

from image_handler import ImageHandler
from update_schema_handler import UpdateAnnoHandler

application = webapp2.WSGIApplication([("/screenshot", ImageHandler), ("/update_schema", UpdateAnnoHandler)], debug=True)
