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
from helper.utils import put_search_document
from helper.utils import OPEN_COMMUNITY


BATCH_SIZE = 50  # ideal batch size may vary based on entity size


class UpdateAnnoHandler(webapp2.RequestHandler):
    def get(self):
        delete_all_anno_indices()
        update_anno_schema()
        update_userannostate_schema_from_anno_action(cls=Vote)
        update_userannostate_schema_from_anno_action(cls=FollowUp)
        update_userannostate_schema_from_anno_action(cls=Flag)
        self.response.out.write("Schema migration successfully initiated.")


def delete_all_anno_indices():
    doc_index = search.Index(name="anno_index")
    start_id = None

    while True:
        document_ids = []
        documents = doc_index.get_range(start_id=start_id, include_start_object=True,
                                        limit=BATCH_SIZE, ids_only=True)

        for document in documents:
            document_ids.append(document.doc_id)
            start_id = document.doc_id

        if not document_ids:
            break

        doc_index.delete(document_ids)

    logging.info("Deleted all Anno indices")


def update_anno_schema(cursor=None):
    anno_list, cursor, more = Anno.query().fetch_page(BATCH_SIZE, start_cursor=cursor)

    anno_update_list = []
    for anno in anno_list:
        # updating anno schema
        if not anno.community:
            anno.community = None
            anno_update_list.append(anno)

        # updating userannostate from anno
        update_userannostate_schema_from_anno(anno)

        # updating anno index
        regenerate_anno_index(anno)

    if len(anno_update_list):
        ndb.put_multi(anno_update_list)

    if more:
        update_anno_schema(cursor=cursor)


def update_userannostate_schema_from_anno(anno):
    user = anno.creator.get()
    modified = anno.last_update_time
    if user:
        UserAnnoState.insert(user=user, anno=anno, modified=modified)


def regenerate_anno_index(anno):
    put_search_document(anno.generate_search_document())


def update_userannostate_schema_from_anno_action(cls, cursor=None):
    activity_list, cursor, more = cls.query()\
                                     .order(cls.created)\
                                     .fetch_page(BATCH_SIZE, start_cursor=cursor)

    for activity in activity_list:
        user = activity.creator.get()
        anno = activity.anno_key.get()
        modified = activity.created
        if user and anno:
            UserAnnoState.insert(user=user, anno=anno, modified=modified)

    if more:
        update_userannostate_schema_from_anno_action(cls=cls, cursor=cursor)
