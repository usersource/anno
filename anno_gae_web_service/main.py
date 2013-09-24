'''
Created on Jun 13, 2013

@author: sergey
'''
import webapp2
from sync import AnnoSync
from utils.ReverseProxyServer import ReverseProxyServer
from community import Community
from testing import test
from testing import sendPost
from AccountManager import AccountManager

application = webapp2.WSGIApplication([('/', AnnoSync),
                                       ('/community', Community), 
                                       ('/test', test.Test),
                                       ('/users', AccountManager),
                                       ('/sendPost', sendPost.SendPost), 
                                       ('/sync', AnnoSync)], debug=True)
application = ReverseProxyServer(application)