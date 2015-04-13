import re
import httplib
import json
import logging
import base64
import random

import endpoints
from google.appengine.api import search
from google.appengine.api import mail
from google.appengine.ext import ndb
from google.appengine.ext.ndb import Key

from model.user import User
from model.appinfo import AppInfo
from model.community import Community
from model.userrole import UserRole
from helper.utils_enum import UserRoleType
from helper.utils_enum import SearchIndexName
from helper.utils_enum import SignInMethod
from helper.settings import SUPPORT_EMAIL_ID
from helper.settings import PROJECT_NAME
from helper.settings import DASHBOARD_URL
from helper.settings import GAE_ADMIN_USERS
from message.appinfo_message import AppInfoMessage
from message.anno_api_messages import AnnoTagsResponseMessage


APP_NAME = "UserSource"
OPEN_COMMUNITY = "__open__"


def get_endpoints_current_user(raise_unauthorized=True):
    """Returns a current user and (optionally) causes an HTTP 401 if no user.

    Args:
        raise_unauthorized: Boolean; defaults to True. If True, this method
            raises an exception which causes an HTTP 401 Unauthorized to be
            returned with the request.

    Returns:
        The signed in user if there is one, else None if there is no signed in
        user and raise_unauthorized is False.
    """
    current_user = endpoints.get_current_user()
    if raise_unauthorized and current_user is None:
        raise endpoints.UnauthorizedException("Oops, something went wrong. Please try later.")
    return current_user


def handle_user(creator_id):
    current_user = get_endpoints_current_user(raise_unauthorized=False)
    if current_user is None:
        if creator_id is not None:
            user = User.find_user_by_email(creator_id + "@gmail.com")
            if user is None:
                user = User.insert_user(email=creator_id + "@gmail.com")
        else:
            email = 'anonymous@usersource.com'
            user = User.find_user_by_email(email)
            if user is None:
                user = User.insert_user(email=email)
    else:
        user = User.find_user_by_email(current_user.email())
        if user is None:
            user = User.insert_user(email=current_user.email())
    return user

def is_auth_user_admin(headers=None, action_auth_user=None):
    is_admin = False
    user = auth_user(headers) if (not action_auth_user and headers) else action_auth_user
    if user:
        community = Community.getCommunityFromTeamKey(user.account_type)
        if community:
            role = UserRole.getRole(user, community)
            is_admin = role == UserRoleType.ADMIN

    return is_admin

def auth_user(headers):
    current_user = get_endpoints_current_user(raise_unauthorized=False)
    user = None

    if current_user is None:
        credential_pair = get_credential(headers)

        signinMethod = SignInMethod.ANNO
        team_key = None
        team_secret = None
        display_name = None
        image_url = None

        if len(credential_pair) == 2:
            email, password = credential_pair
        elif len(credential_pair) == 5:
            signinMethod, email, password, team_key, team_secret = credential_pair
        else:
            signinMethod, email, password, team_key, team_secret, display_name, image_url = credential_pair

        validate_email(email)
        user = User.find_user_by_email(email, team_key)

        if signinMethod == SignInMethod.ANNO:
            User.authenticate(email, md5(password))
        elif signinMethod == SignInMethod.PLUGIN:
            if not Community.authenticate(team_key, team_secret):
                 raise endpoints.UnauthorizedException("Incorrect team key or secret")

            display_name = unicode(display_name, "utf-8", "ignore")
            if not user:
                user = User.insert_user(email=email, username=display_name, account_type=team_key, image_url=image_url)
                community = Community.getCommunityFromTeamKey(team_key)
                UserRole.insert(user, community)
            elif (display_name and display_name != user.display_name) or (image_url and image_url != user.image_url):
                User.update_user(user=user, email=email, username=display_name, account_type=team_key, image_url=image_url)
    else:
        user = User.find_user_by_email(current_user.email())

    if user is None:
        raise endpoints.UnauthorizedException("Oops, something went wrong. Please try later.")

    return user

def get_user_team_token(email, password, team_key, team_secret, display_name, image_url):
    token = dict(token_type="Basic", expires_in=3600 * 24)
    user_info_data = ['plugin', email, password, team_key, team_secret, display_name, image_url]
    token["access_token"] = base64.b64encode("_$_".join(user_info_data))
    return token

def update_user_team_token(headers, team_key=None, team_secret=None):
    credential_pair = get_credential(headers)

    team_key = team_key or credential_pair[3]
    team_secret = team_secret or credential_pair[4]

    return get_user_team_token(credential_pair[1],
                               credential_pair[2],
                               team_key,
                               team_secret,
                               credential_pair[5],
                               credential_pair[6])

def get_country_by_coordinate(latitude, longitude):
    """
    This function returns country information by the specified coordinate.
    It sends request to google map by providing latitude&longitude and parse out country information from
    the response.

    The country part of google map response is like:
    {
        "long_name" : "United States",
        "short_name" : "US",
        "types" : [ "country", "political" ]
    }
    TODO: now we only return long_name, maybe in the future we will return both long_name and short_name if necessary.
    """
    map_url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + str(latitude) + "," + str(
        longitude) + "&sensor=false"
    conn = httplib.HTTPConnection("maps.googleapis.com")
    conn.request('GET', map_url)
    result = conn.getresponse()
    content = result.read()
    location_json = json.loads(content)
    for address_component in location_json['results'][0]['address_components']:
        logging.info("long_name:" + address_component['long_name'])
        logging.info("short name:" + address_component['short_name'])
        logging.info("types[0]:" + address_component['types'][0])
        if address_component['types'][0] == 'country':
            return address_component['long_name']


def validate_email_address_format(email):
    em_re = re.compile("^[\w\.=-]+@[\w\.-]+\.[\w]{2,3}$")
    return em_re.match(email)


def validate_email(email):
    if email is None or email == '':
        raise endpoints.BadRequestException("Email is missing.")
    if not validate_email_address_format(email):
        raise endpoints.BadRequestException("Email format is incorrect.")


def validate_password(password):
    if password is None or password == '':
        raise endpoints.BadRequestException("User password can't be empty.")


def validate_team_secret(team_secret):
    if team_secret is None or team_secret == '':
        raise endpoints.BadRequestException("Team Secret can't be empty.")


def md5(content):
    import hashlib

    m = hashlib.md5()
    m.update(content)
    return m.hexdigest()


def get_credential(headers):
    authorization = headers.get("Authorization", headers.get("authorization"))
    if authorization is None:
        raise endpoints.UnauthorizedException("Oops, something went wrong. Please try later.")

    basic_auth_string = authorization.split(' ')
    if len(basic_auth_string) != 2:
        raise endpoints.UnauthorizedException("Oops, something went wrong. Please try later.")

    try:
        credential = base64.b64decode(basic_auth_string[1])
        credential_pair = credential.split('_$_')
        # ":" was used before to split
        if len(credential_pair) == 1:
            credential_pair = credential.split(':')
    except Exception as e:
        logging.info("basic auth string: %s", basic_auth_string)
        logging.exception("Exception in get_credential")
        credential_pair = []

    # length of credential_pair for old JS is 2 and 5 while for new is 7
    if len(credential_pair) not in [2, 5, 7]:
        raise endpoints.UnauthorizedException("Oops, something went wrong. Please try later.")

    return credential_pair


def put_search_document(doc, search_index_name):
    # index this document.
    try:
        index = search.Index(name=search_index_name)
        index.put(doc)
    except search.Error:
        logging.exception('Put document failed.')


def delete_all_in_index(index_name):
    """Delete all the docs in the given index."""
    doc_index = search.Index(name=index_name)

    # looping because get_range by default returns up to 100 documents at a time
    while True:
        # Get a list of documents populating only the doc_id field and extract the ids.
        document_ids = [document.doc_id
                        for document in doc_index.get_range(ids_only=True)]
        if not document_ids:
            break
        # Delete the documents for the given ids from the Index.
        doc_index.delete(document_ids)


def tokenize_string(string_value):
    """find all words in the given string value"""
    return re.findall(r'(\w+)', string_value)


def is_empty_string(string_value):
    """
    Checks if the given string value is empty.
    """
    if string_value is None:
        return True
    if re.match(r'^\s*$', string_value) is not None:
        return True
    return False

def getCommunityForApp(id=None, app_name=None):
    if id:
        app = AppInfo.get_by_id(id)
    elif app_name:
        app = AppInfo.get(name=app_name)

    app_community = None
    if app:
        communities = Community.query().fetch()
        for community in communities:
            if app.key in community.apps:
                app_community = community
                break

    return app_community

def getCommunityApps(community_id=None, team_key=None, app_count=None):
    if community_id:
        community = Community.get_by_id(community_id)
    elif team_key:
        community = Community.query(Community.team_key == team_key).get()

    return community.apps[0:app_count] if app_count else community.apps

def getAppInfo(community_id=None, team_key=None):
    community_apps = getCommunityApps(community_id, team_key, app_count=1)
    if len(community_apps):
        appinfo = AppInfo.get_by_id(community_apps[0].id())
    else:
        raise endpoints.NotFoundException("Selected community doesn't have any app associated with it. Please select another option.")
    return appinfo

def getAppAndCommunity(message, user):
    if message.team_key:
        community = Community.getCommunityFromTeamKey(team_key=message.team_key)
        appinfo = getAppInfo(community.key.id())

    elif message.app_name:
        appinfo = AppInfo.get(name=message.app_name, platform=message.platform_type)
        community = None

        if appinfo is None:
            appInfoMessage = AppInfoMessage(name=message.app_name, version=message.app_version,
                                            platform=message.platform_type)
            appinfo = AppInfo.insert(appInfoMessage)
        else:
            app_community = getCommunityForApp(id=appinfo.key.id())
            if app_community and isMember(app_community, user):
                community = app_community

    elif message.community_name:
        community_id = Community.getCommunity(community_name=message.community_name).id
        community = Community.get_by_id(community_id)
        appinfo = getAppInfo(community_id)

    else:
        raise endpoints.BadRequestException("Please specify a community or app")

    return appinfo, community

def user_community(user):
    userroles = UserRole.query().filter(UserRole.user == user.key)\
                                .fetch(projection=[UserRole.community, UserRole.role, UserRole.circle_level])

    results = []
    for userrole in userroles:
        results.append(dict(community=userrole.community, role=userrole.role, circle_level=userrole.circle_level))

    return results

def isMember(community, user, include_manager=True):
    if include_manager:
        query = UserRole.query(ndb.AND(UserRole.community == community.key,
                                       UserRole.user == user.key)
                               )
    else:
        query = UserRole.query(ndb.AND(UserRole.community == community.key,
                                       UserRole.user == user.key,
                                       UserRole.role == UserRoleType.MEMBER)
                               )

    results = query.get()
    return True if results else False

def filter_anno_by_user(query, user, is_plugin=False, include_archived=False):
    filter_strings = []

    user_community_dict = { role.get("community") : role.get("circle_level") for role in user_community(user) }
    for community, circle_level in user_community_dict.iteritems():
        if circle_level > 0:
            circle_level_list = [ int(level) for level in community.get().circles.keys() if int(level) <= circle_level ]
        else:
            circle_level_list = [ circle_level ]

        filter_strings.append("ndb.AND(Anno.community == " + str(community) +
                              ", Anno.circle_level.IN(" + str(circle_level_list) +
                              "))")

    if not is_plugin:
        filter_strings.append("Anno.community == " + str(None))

    from model.anno import Anno
    query = eval("query.filter(ndb.OR(%s))" % ", ".join(filter_strings))

    if not include_archived:
        query = query.filter(Anno.archived == False)

    query = query.order(Anno._key)
    return query

def get_user_from_request(user_id=None, user_email=None, team_key=None):
    user = None
    if user_id:
        user = User.get_by_id(user_id)
    elif user_email:
        user = User.find_user_by_email(user_email, team_key)
    return user

def reset_password(user, email):
    # creating new password
    new_password_string = hex(random.randint(1000000, 9999999))[2:]
    user.password = md5(new_password_string)
    user.put()

    subject = "Reset Password"
    body = "Your new password for usersource account is %s" % new_password_string
    send_email(SUPPORT_EMAIL_ID, email, subject, body)

def send_email(sender, to, subject="", body="", html=""):
    message = mail.EmailMessage(sender=sender, to=to, subject=subject, body=body, html=html)
    message.send()

def parseTeamName(name):
    return re.sub('[^A-Za-z0-9]+', '-', name).lower().strip('-')

def send_added_user_email(team_name, added_user_name, action, action_user_name, team_hash):
    dashboard_url = DASHBOARD_URL % (team_hash, parseTeamName(team_name))

    to = GAE_ADMIN_USERS
    subject = "UserSource '%s': Member update in '%s'" % (PROJECT_NAME, team_name)
    body = "Hello,<br/><br/>Member '%s' got %s to the project '%s' by '%s'.<br/><br/>The dashboard can be accessed at <a href='%s'>%s</a>"
    body = body % (added_user_name, action, team_name, action_user_name, dashboard_url, dashboard_url)

    send_email(SUPPORT_EMAIL_ID, to, subject=subject, html=body)

def send_created_team_email(team_name, action_user_name):
    to = GAE_ADMIN_USERS
    subject = "UserSource '%s': New team created" % PROJECT_NAME
    body = "Hello,<br/><br/>'%s' created new team '%s'."
    body = body % (action_user_name, team_name)
    send_email(SUPPORT_EMAIL_ID, to, subject=subject, html=body)

def send_access_team_email(action_user_email, team_hash, team_name):
    dashboard_url = DASHBOARD_URL % (team_hash, parseTeamName(team_name))

    to = action_user_email
    subject = "UserSource Dashboard"
    body = "Hello,<br/><br/>You have created your project '%s' successfully.<br/><br/>The dashboard can be accessed at <a href='%s'>%s</a>"
    body = body % (team_name, dashboard_url, dashboard_url)
    send_email(SUPPORT_EMAIL_ID, to, subject=subject, html=body)

def send_first_anno_email(team_name, action_user_name):
    to = GAE_ADMIN_USERS
    subject = "UserSource '%s': First item created" % PROJECT_NAME
    body = "Hello,<br/><br/>'%s' created first item for team '%s'."
    body = body % (action_user_name, team_name)
    send_email(SUPPORT_EMAIL_ID, to, subject=subject, html=body)

def extract_tags_from_text(text):
    tagcloud = {}
    # find all hashtags
    tags = re.findall("#([a-zA-Z0-9_]+)", text)
    for i, tag in enumerate(tags):
        # Only update for the first occurence
        tagcloud.setdefault(tag, tags.count(tag))

    return tagcloud

def parseTeamNotesForHashtags(team_notes):
    hashtag_list = []
    if team_notes:
        for hashtag in list(set(re.findall(r'(#[a-z\d][\w-]*)', team_notes))):
            hashtag_list.append(AnnoTagsResponseMessage(value=hashtag))

    return hashtag_list
