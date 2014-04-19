__author__ = 'topcircler'

import webapp2

from image_handler import ImageHandler


application = webapp2.WSGIApplication([('/screenshot', ImageHandler)], debug=True)