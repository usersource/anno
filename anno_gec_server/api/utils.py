__author__ = 'topcircler'

import re
import httplib
import json
import logging
import base64

import endpoints
from google.appengine.api import search
from google.appengine.ext import ndb

from model.user import User
from model.appinfo import AppInfo
from model.community import Community
from model.userrole import UserRole

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
        raise endpoints.UnauthorizedException('Invalid token.')
    return current_user


def handle_user(creator_id):
    current_user = get_endpoints_current_user(raise_unauthorized=False)
    if current_user is None:
        if creator_id is not None:
            user = User.find_user_by_email(creator_id + "@gmail.com")
            if user is None:
                user = User.insert_user(creator_id + "@gmail.com")
        else:
            email = 'anonymous@usersource.com'
            user = User.find_user_by_email(email)
            if user is None:
                user = User.insert_user(email)
    else:
        user = User.find_user_by_email(current_user.email())
        if user is None:
            user = User.insert_user(current_user.email())
    return user

def auth_user(headers):
    current_user = get_endpoints_current_user(raise_unauthorized=False)
    user = None

    if current_user is None:
        credential_pair = get_credential(headers)
        email = credential_pair[0]
        validate_email(email)
        User.authenticate(credential_pair[0], md5(credential_pair[1]))
        user = User.find_user_by_email(email)
    else:
        user = User.find_user_by_email(current_user.email())

    if user is None:
        raise endpoints.UnauthorizedException("No permission.")

    return user

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


def md5(content):
    import hashlib

    m = hashlib.md5()
    m.update(content)
    return m.hexdigest()


def get_credential(headers):
    authorization = headers["Authorization"]
    if authorization is None:
        raise endpoints.UnauthorizedException("No permission.")
    basic_auth_string = authorization.split(' ')
    if len(basic_auth_string) != 2:
        raise endpoints.UnauthorizedException("No permission.")
    credential = base64.b64decode(basic_auth_string[1])
    credential_pair = credential.split(':')
    if len(credential_pair) != 2:
        raise endpoints.UnauthorizedException("No permission.")
    return credential_pair


def put_search_document(doc):
    # index this document.
    try:
        index = search.Index(name="anno_index")
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
        app = AppInfo.getAppByName(app_name)

    communities = Community.query().fetch()

    for community in communities:
        if app.key in community.apps:
            return community

def user_community(user):
    userroles = UserRole.query().filter(UserRole.user == user.key)\
                                .fetch(projection=[UserRole.community, UserRole.role])

    results = []
    for userrole in userroles:
        results.append(dict(community=userrole.community, role=userrole.role))

    return results

def isMember(community, user, include_manager=True):
    if include_manager:
        query = UserRole.query(ndb.AND(UserRole.community == community.key,
                                       UserRole.user == user.key)
                               )
    else:
        query = UserRole.query(ndb.AND(UserRole.community == community.key, 
                                       UserRole.user == user.key, 
                                       UserRole.role == "member")
                               )

    results = query.get()
    return True if results else False

def filter_anno_by_user(query, user):
    from model.anno import Anno
    user_community_list = [ userrole.get("community") for userrole in user_community(user) ]
    user_community_list.append(None)
    query = query.filter(Anno.community.IN(user_community_list))
    return query.order(Anno._key)

def get_user_from_request(user_id=None, user_email=None):
    if user_id:
        user = User.get_by_id(user_id)
    elif user_email:
        user = User.find_user_by_email(user_email)
    return user

def get_invite_mail_content(user_name, user_email, role, invite_msg, community_name, invite_hash):
    recipients = [user_email]
    subject = "UserSource Invitation"
    message = "Dear {user_name}, you are invited to join '{community_name}' community."

    if user_name is None:
        user_name = "User"

    message = message.format(user_name=user_name, community_name=community_name)
    return json.dumps(dict(message=message, subject=subject, recipients=recipients))

"""
annoserver:
anno_js_client_id = "22913132792.apps.googleusercontent.com"
annoserver-test:
anno_js_client_id = "394023691674-7j5afcjlibblt47qehnsh3d4o931orek.apps.googleusercontent.com"
usersource-anno:
anno_js_client_id = "955803277195.apps.googleusercontent.com"
"""
anno_js_client_id = "955803277195.apps.googleusercontent.com"
