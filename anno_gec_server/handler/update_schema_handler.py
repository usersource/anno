__author__ = "rekenerd"

import logging
import webapp2

from google.appengine.api import search
from google.appengine.ext import ndb
from google.appengine.ext import deferred

from model.anno import Anno
from model.userannostate import UserAnnoState
from model.vote import Vote
from model.follow_up import FollowUp
from model.flag import Flag
from helper.utils import put_search_document
from helper.utils import OPEN_COMMUNITY


BATCH_SIZE = 100  # ideal batch size may vary based on entity size


class UpdateAnnoHandler(webapp2.RequestHandler):
    def get(self):
        deferred.defer(deleteAllInIndex)
        deferred.defer(UpdateAnnoSchema)
        deferred.defer(UpdateUserAnnoStateSchemaFromAnnoAction, Vote)
        deferred.defer(UpdateUserAnnoStateSchemaFromAnnoAction, FollowUp)
        deferred.defer(UpdateUserAnnoStateSchemaFromAnnoAction, Flag)
        self.response.out.write("Schema migration successfully initiated.")


def deleteAllInIndex():
    doc_index = search.Index(name="anno_index")

    try:
        while True:
            document_ids = [ document.doc_id for document in doc_index.get_range(ids_only=True) ]
            if not document_ids:
                break
            doc_index.delete(document_ids)
    except search.Error:
        logging.exception("Error removing documents")


def UpdateAnnoSchema(cursor=None):
    anno_list, cursor, more = Anno.query().fetch_page(BATCH_SIZE, start_cursor=cursor)

    anno_update_list = []
    for anno in anno_list:
        # updating anno schema
        if not hasattr(anno, "community"):
            anno.community = None
            anno_update_list.append(anno)

        # updating userannostate from anno
        UpdateUserAnnoStateSchemaFromAnno(anno)

        # updating anno index
        regenerate_anno_index(anno)

    if len(anno_update_list):
        ndb.put_multi(anno_update_list)

    if more:
        deferred.defer(UpdateAnnoSchema, cursor=cursor)


def UpdateUserAnnoStateSchemaFromAnno(anno):
    user = anno.creator.get()
    modified = anno.last_update_time
    if user:
        UserAnnoState.insert(user=user, anno=anno, modified=modified)


def regenerate_anno_index(anno):
    put_search_document(anno.generate_search_document())


def UpdateUserAnnoStateSchemaFromAnnoAction(cls, cursor=None):
    activity_list, cursor, more = cls.query().order(Vote.created).fetch_page(BATCH_SIZE, start_cursor=cursor)

    for activity in activity_list:
        user = activity.creator.get()
        anno = activity.anno_key.get()
        modified = activity.created
        if user and anno:
            UserAnnoState.insert(user=user, anno=anno, modified=modified)

    if more:
        deferred.defer(UpdateUserAnnoStateSchemaFromAnnoAction, cls=cls, cursor=cursor)
