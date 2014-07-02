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

    def UpdateAnnoSchema(self):
        update_annos = []

        for anno in Anno.query().fetch():
            if anno.community is None:
                anno.community = None
                update_annos.append(anno)

        ndb.put_multi(update_annos)
        logging.info("UpdateAnnoSchema completed")

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

    def UpdateUserAnnoStateSchema(self):
        for anno in Anno.query().fetch():
            UserAnnoState.insert(user=anno.creator.get(), anno=anno.key.get())

        activities = Vote.query().fetch() + FollowUp.query().fetch() + Flag.query().fetch()

        for activity in activities:
            UserAnnoState.insert(user=activity.creator.get(), anno=activity.anno_key.get())

        logging.info("UpdateUserAnnoStateSchema completed")
