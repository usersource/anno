__author__ = 'topcircler'

import re
import endpoints
import httplib
import json
import logging
import base64
from model.user import User


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

def get_user(headers):
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

"""
annoserver:
anno_js_client_id = "22913132792.apps.googleusercontent.com"
annoserver-test:
anno_js_client_id = "394023691674-7j5afcjlibblt47qehnsh3d4o931orek.apps.googleusercontent.com"
usersource-anno:
anno_js_client_id = "955803277195.apps.googleusercontent.com"
"""
anno_js_client_id = "22913132792.apps.googleusercontent.com"