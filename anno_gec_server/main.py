__author__ = 'topcircler'

import webapp2

from image_handler import ImageHandler
from tasks.push_notifications_task import PushHandler

application = webapp2.WSGIApplication([('/screenshot', ImageHandler), ('/push', PushHandler)], debug=True)