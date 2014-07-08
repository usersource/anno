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
from helper.utils import OPEN_COMMUNITY


class UpdateAnnoHandler(webapp2.RequestHandler):

    def get(self):
        self.UpdateAnnoSchema()
        self.UpdateAnnoSearchIndexes()
        self.UpdateUserAnnoStateSchema()
        self.response.out.write("Schema migration successfully initiated.")


    def UpdateAnnoSchema(self):
        '''
        .. py:function:: UpdateAnnoSchema()
            Updated Anno datastore with new Anno model.
            It update "community" field with None if not present.
        '''
        anno_update_list = []
        anno_list = Anno.query().fetch()

        for anno in anno_list:
            if anno.community is None:
                anno.community = None
                anno_update_list.append(anno)

        ndb.put_multi(anno_update_list)
        logging.info("UpdateAnnoSchema completed")


    def UpdateAnnoSearchIndexes(self):
        '''
        .. py:function:: UpdateAnnoSearchIndexes()
            Update anno index with new Anno model
            It adds "community" field in index.
        '''
        index = search.Index(name="anno_index")
        start_id = None

        while True:
            resp = index.get_range(start_id=start_id, include_start_object=False)
            if not resp.results:
                break
            for doc in resp:
                fields = [ f for f in doc.fields if f.name != 'community' ] + ([ f for f in doc.fields if f.name == "community" and f.value != None] or [ search.TextField(name="community", value=OPEN_COMMUNITY)])
                anno_document = search.Document(doc_id=doc.doc_id, fields=fields)
                index.put(anno_document)
                start_id = doc.doc_id

        logging.info("UpdateAnnoSearchIndexes completed")


    def UpdateUserAnnoStateSchema(self):
        '''
        .. py:function:: UpdateUserAnnoStateSchema()
            Create user anno state for old anno and its interaction
        '''
        for anno in Anno.query().fetch():
            if anno:
                user = anno.creator.get()
                modified = anno.last_update_time
                if user:
                    UserAnnoState.insert(user=user, anno=anno, modified=modified)

        activities = Vote.query().order(Vote.created).fetch()
        activities += FollowUp.query().order(FollowUp.created).fetch()
        activities += Flag.query().order(Flag.created).fetch()

        for activity in activities:
            user = activity.creator.get()
            anno = activity.anno_key.get()
            modified = activity.created
            if user and anno:
                UserAnnoState.insert(user=user, anno=anno, modified=modified)

        logging.info("UpdateUserAnnoStateSchema completed")
