__author__ = 'rekenerd'

"""
Invite data store model definition.
"""

from formencode.validators import Email

from google.appengine.ext import ndb

from model.base_model import BaseModel
from model.community import Community

class Invite(BaseModel):
    email = ndb.StringProperty(required=True, validator=Email())
    community = ndb.KeyProperty(kind=Community, required=True)
    role = ndb.StringProperty(choices=['member', 'manager'], required=True, default='member')
