__author__ = "rekenerd"

import logging
import webapp2

from google.appengine.api import search
from google.appengine.ext import ndb

from model.anno import Anno
from model.userannostate import UserAnnoState
from model.vote import Vote
from model.follow_up import FollowUp
from model.flag import Flag

class UpdateAnnoHandler(webapp2.RequestHandler):
    def get(self):
        self.UpdateAnnoSchema()
        self.UpdateAnnoSearchIndexes()
        self.UpdateUserAnnoStateSchema()
        self.response.out.write("Schema migration successfully initiated.")

    '''
    .. py:function:: UpdateAnnoSchema()
        Updated Anno datastore with new Anno model.
        It update "community" field with None if not present.
    '''
    def UpdateAnnoSchema(self):
        anno_key_list = []
        anno_list = Anno.query().fetch()

        for anno in anno_list:
            if anno.community is None:
                anno.community = None
                anno_key_list.append(anno.key)

        ndb.put_multi(anno_key_list)
        logging.info("UpdateAnnoSchema completed")

    '''
    .. py:function:: UpdateAnnoSearchIndexes()
        Update anno index with new Anno model
        It adds "community" field in index.
    '''
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

        logging.info("UpdateAnnoSearchIndexes completed")

    '''
    .. py:function:: UpdateUserAnnoStateSchema()
        Create user anno state for old anno and its interaction
    '''
    def UpdateUserAnnoStateSchema(self):
        for anno in Anno.query().fetch():
            user = anno.creator.get()
            anno = anno.key.get()
            if user and anno:
                UserAnnoState.insert(user=user, anno=anno)

        activities = Vote.query().fetch() + FollowUp.query().fetch() + Flag.query().fetch()

        for activity in activities:
            user = activity.creator.get()
            anno = activity.anno_key.get()
            if user and anno:
                UserAnnoState.insert(user=user, anno=anno)

        logging.info("UpdateUserAnnoStateSchema completed")
