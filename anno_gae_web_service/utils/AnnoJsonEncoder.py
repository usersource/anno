'''
Created on Jun 16, 2013

@author: sergey
'''

import json
from datetime import datetime
from model.AnnoSyncEntity import AnnoSyncEntity
from google.appengine.ext import db

class AnnoJsonEncoder(json.JSONEncoder):
    '''
    classdocs
    '''
    def default(self, obj):
        if isinstance(obj, AnnoSyncEntity):
            return "AnnoSyncEntity"
        elif isinstance(obj, db.DateTimeProperty):
            return "db.DateTimeProperty"

        elif isinstance(obj, datetime):
            return obj.isoformat()

        elif isinstance(obj, db.TextProperty):
            return unicode(obj)

        elif isinstance(obj, db.StringProperty):
            return unicode(obj)

        elif isinstance(obj, db.Model):
            return dict((p, getattr(obj, p))
                        for p in obj.properties())

        elif isinstance(obj, db.UserProperty):
            return obj.__dict__

        else:
            ""  # return json.JSONEncoder.default(self, obj)
