import logging
import webapp2

from google.appengine.api import search
from google.appengine.ext import ndb

from model.anno import Anno
from model.userannostate import UserAnnoState
from model.vote import Vote
from model.follow_up import FollowUp
from model.flag import Flag
from model.appinfo import AppInfo
from model.tags import Tag
from model.user import User
from model.community import Community
from model.userrole import UserRole
from helper.utils import put_search_document
from helper.utils import OPEN_COMMUNITY
from helper.utils import extract_tags_from_text
from helper.utils import md5
from helper.utils_enum import SearchIndexName
from message.appinfo_message import AppInfoMessage
from message.community_message import CommunityMessage
from message.user_message import UserMessage

BATCH_SIZE = 50  # ideal batch size may vary based on entity size


class UpdateAnnoHandler(webapp2.RequestHandler):
    def get(self):
#        create_teams()
#        migrate_photo_time_annos()
#        add_teamhash()
#        update_anno_schema()
#        update_userannostate_schema()
#         add_lowercase_appname()
#         delete_all_anno_indices()
#         update_followup_indices()
#         update_userannostate_schema_from_anno_action(cls=Vote)
#         update_userannostate_schema_from_anno_action(cls=FollowUp)
#         update_userannostate_schema_from_anno_action(cls=Flag)
        self.response.out.write("Schema migration successfully initiated.")

def create_teams():
    team_key = ""
    app_name = ""
    community_name = ""
    admin_user_email = ""
    other_users_email = []

    app = AppInfo.query().filter(AppInfo.lc_name == app_name.lower()).get()
    if not app:
        appinfo_message = AppInfoMessage()
        appinfo_message.name = app_name
        app = AppInfo.insert(appinfo_message)

    community = Community.getCommunityFromTeamKey(team_key=team_key)
    if not community:
        community_message = CommunityMessage(name=community_name,
                                             team_key=team_key,
                                             team_secret=md5(community_name.lower()))
        community_message.user = UserMessage(user_email=admin_user_email)
        Community.insert(community_message)
        community = Community.getCommunityFromTeamKey(team_key=team_key)

    if community and app:
        if not app.key in community.apps:
            community.apps.append(app.key)
            community.put()

    for user_email in other_users_email:
        user = User.find_user_by_email(email=user_email, team_key=team_key)
        if not user:
            user = User.insert_user(user_email, account_type=team_key, image_url="")
        userrole = UserRole.insert(user, community)

def migrate_photo_time_annos(cursor=None):
    team_key = 'us.orbe.Reko-Album'
    phototime_app = AppInfo.query().filter(AppInfo.lc_name == 'phototime').get()
    phototime_community = Community.getCommunityFromTeamKey(team_key=team_key)
    anno_list = Anno.query().filter(Anno.app == phototime_app.key).fetch()

    for anno in anno_list:
        anno.community = phototime_community.key
        user_email = anno.creator.get().user_email
        anno.creator = User.find_user_by_email(email=user_email, team_key=team_key).key
        anno.put()

def delete_all_anno_indices():
    doc_index = search.Index(name=SearchIndexName.ANNO)
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
        # updating anno schema for plugin
        if not anno.archived:
            anno.archived = False
            anno_update_list.append(anno)

        # updating app for anno schema
#         if not anno.app:
#             appinfo = AppInfo.get(name=anno.app_name)
#
#             if appinfo is None:
#                 appInfoMessage = AppInfoMessage(name=anno.app_name, version=anno.app_version)
#                 appinfo = AppInfo.insert(appInfoMessage)
#
#             anno.app = appinfo.key
#             anno_update_list.append(anno)

        # updating anno schema for community
#         if not anno.community:
#             anno.community = None
#             anno_update_list.append(anno)

        # updating anno schema for anno_id
#         if not anno.anno_id:
#             anno.anno_id = anno.key.id()
#             anno_update_list.append(anno)

        # updating userannostate from anno
#         update_userannostate_schema_from_anno(anno)

        # updating anno index
#         regenerate_index(anno, SearchIndexName.ANNO)

        # extract tag
#         create_tags(anno.anno_text)

    if len(anno_update_list):
        ndb.put_multi(anno_update_list)

    if more:
        update_anno_schema(cursor=cursor)

def update_userannostate_schema(cursor=None):
    userannostate_list, cursor, more = UserAnnoState.query().fetch_page(BATCH_SIZE, start_cursor=cursor)

    userannostate_update_list = []
    for userannostate in userannostate_list:
        if not userannostate.tagged:
            userannostate.tagged = False
            userannostate_update_list.append(userannostate)

    if len(userannostate_update_list):
        ndb.put_multi(userannostate_update_list)

    if more:
        update_userannostate_schema(cursor=cursor)


def update_followup_indices(cursor=None):
    followup_list, cursor, more = FollowUp.query().fetch_page(BATCH_SIZE, start_cursor=cursor)

    for followup in followup_list:
#         regenerate_index(followup, SearchIndexName.FOLLOWUP)
        create_tags(followup.comment)

    if more:
        update_followup_indices(cursor=cursor)


def update_userannostate_schema_from_anno(anno):
    user = anno.creator.get()
    modified = anno.last_update_time
    if user:
        UserAnnoState.insert(user=user, anno=anno, modified=modified)


def regenerate_index(entity, search_index_name):
    put_search_document(entity.generate_search_document(), search_index_name)


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


def add_lowercase_appname(cursor=None):
    appinfo_list, cursor, more = AppInfo.query().fetch_page(BATCH_SIZE, start_cursor=cursor)

    appinfo_update_list = []
    for appinfo in appinfo_list:
        if not appinfo.lc_name:
            appinfo.lc_name = appinfo.name.lower()
            appinfo_update_list.append(appinfo)

    if len(appinfo_update_list):
        ndb.put_multi(appinfo_update_list)

    if more:
        add_lowercase_appname(cursor=cursor)

def add_teamhash(cursor=None):
    community_list, cursor, more = Community.query().fetch_page(BATCH_SIZE, start_cursor=cursor)

    community_update_list = []
    for community in community_list:
        if (not community.team_hash) and community.team_key:
            community.team_hash = md5(community.team_key)[-8:]
            community_update_list.append(community)

    if len(community_update_list):
        ndb.put_multi(community_update_list)

    if more:
        add_teamhash(cursor=cursor)

def create_tags(text):
    tags = extract_tags_from_text(text.lower())
    for tag, count in tags.iteritems():
        Tag.add_tag_total(text=tag, total=count)
