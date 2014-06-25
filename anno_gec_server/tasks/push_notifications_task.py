import json, logging, math, time

# These should go into a settings file
API_KEY = ''
APNS_PUSH_CERT = 'APNS_Certificates/<WE-NEED-A-FILE>.pem'
APNS_PUSH_KEY = 'APNS_Certificates/<WE-NEED-A-FILE>.pem'

# Must be upfront before importing APNS
# http://stackoverflow.com/questions/16192916/importerror-no-module-named-ssl-with-dev-appserver-py-from-google-app-engine/16937668#16937668
import os
# Are we Development
if os.environ.get('SERVER_SOFTWARE','').startswith('Development'):
    # The above if statement should be centrally controlled and the resulting flag should be imported
    import sys

    # Add to the Whitelist
    from google.appengine.tools.devappserver2.python import sandbox
    sandbox._WHITE_LIST_C_MODULES += ['_ssl', '_socket']

    # Use the stdlib Python socket rather than Googles wrapped stub
    from lib import socket as patched_socket
    sys.modules['socket'] = patched_socket
    socket = patched_socket

    # Dev Keys and certificates
    API_KEY = 'AIzaSyCNWf_rZCovDez9Dmzx7CA-m6IHHUmh-SU' # Already existing Public Key for Google Services
    APNS_PUSH_CERT = 'APNS_Certificates/aps_development.pem'
    APNS_PUSH_KEY = 'APNS_Certificates/PushNotificationsDev.pem'

    # Use the APNS sandbox environment
    APNS_USE_SANDBOX = True

from gcm import GCM
from PyAPNs.apns import APNs, Payload, PayloadTooLargeError

import webapp2
from google.appengine.api import taskqueue


class PushTaskQueue(object):
    '''
    Wrapper to add Tasks to the Push Queue
    '''
    QUEUE_URL = '/push'

    @classmethod
    def add(cls, message, ids):
        '''
        Add a job to the Task Queue
        '''
        taskqueue.add(url=cls.QUEUE_URL, params={'message': message, 'ids': ids})

class PushHandler(webapp2.RequestHandler):
    '''
    A TaskQueue request handler targeted at scaling push notifications
    '''

    def __init__(self, *args, **kargs):
        self.pusher = PushService(gcm_apikey=self.API_KEY, apns_push_key=APNS_PUSH_KEY, apns_push_cert=APNS_PUSH_CERT)
        super(PushHandler, self).__init__(*args, **kargs)

    def post(self):
        message = self.request.get('message')
        typ = self.request.get('type')
        try:
            ids = json.loads(self.request.get('ids'))
        except TypeError:
            logging.getLogger().exception("Error while JSON parsing Registration ID's")
            self.response.out.write(json.loads(dict(success=False)))

        res = self.pusher.push(typ, message, ids)
        res = json.dumps(res)

        # logging.getLogger().info("Response: %s", res)
        self.response.out.write(res)

    def get(self):
        self.response.out.write('Push Service Running...')


class PushService(object):
    '''
    Pushes to Android via Google Cloud Messaging
    Pushes to iOS via Apple Push Notification Service
    '''
    TYPE_ANDROID = 'android'
    TYPE_IOS = 'ios'
    GCM_RESPONSE_ERRORS = 'errors'
    GCM_RESPONSE_CANONICAL = 'canonical'

    GCM_MAX_BULK = 1000

    # This does not quite work on GAE Dev
    # https://groups.google.com/forum/#!topic/google-appengine/P-1Gpwpry7w
    APNS_ENHANCED = False

    def __init__(self, gcm_apikey=None, apns_push_cert=None, apns_push_key=None):
        '''
        Constructor
        :param str gcm_apikey: The GCM APIKey
        :param str apns_push_cert: The file path to the APNS Certificate .pem file
        :param str apns_push_key: The file path to the APNS Key .pem file
        '''
        self.gcm_key = gcm_apikey
        self.apns_push_cert = apns_push_cert
        self.apns_push_key = apns_push_key
        self._gcm = None
        self._apns = None

    @property
    def gcm(self):
        '''
        Makes sure there is a GCM object only when required
        :return: The Python GCM Object
        '''
        if not self._gcm: self._gcm = GCM(self.gcm_key)
        return self._gcm

    # This will only work in dev GAE under the correct conditions (replacing the wrapped socket stubs)
    # http://stackoverflow.com/questions/16192916/importerror-no-module-named-ssl-with-dev-appserver-py-from-google-app-engine/16937668#16937668
    @property
    def apns(self):
        '''
        Makes sure there is an APNS object only when required
        This is efficient since the APNS object opens a secure TCP stream
        :return: The Python APNS Object
        '''
        if not self._apns: 
            self._apns = APNs(use_sandbox=APNS_USE_SANDBOX, cert_file=self.apns_push_cert, key_file=self.apns_push_key, enhanced=self.APNS_ENHANCED)
            if self.APNS_ENHANCED:
                self._apns.gateway_server.register_response_listener(self._apns_response_listener)
        return self._apns

    def _apns_response_listener(self, error):
        logging.getLogger().error("Error Response for APNS: %s", error)

    def push(self, typ, message, ids):
        '''
        Use this method to initiate push notifications to either
        Apple or Android devices
        :param str typ: Represents the type of Registration ID's used (either ios or android)
        :param str message: The text message to be displayed on the Client Devices
        :param list ids: A list of target Registered Device ID's
        '''
        if typ == self.TYPE_ANDROID:
            return self._push_to_android(message, ids)
        elif typ == self.TYPE_IOS:
            return self._push_to_ios(message, ids)
        return dict(success=False, reason=("Unknown Type %s"%(typ)))

    def _push_to_android(self, message, ids):
        '''
        Google Cloud Messaging Push Notifications using python-gcm
        :param str message: Message to be sent
        :param list ids: List of target Registered Device ID's
        :return: A list of response messages (due to chunking constraints)
        '''
        responses = []

        # blocks of self.GCM_MAX_BULK
        blocks = math.ceil(len(ids)/self.GCM_MAX_BULK)
        for b in range(blocks):
            block = b * self.GCM_MAX_BULK
            next_block = block + self.GCM_MAX_BULK

            response = self.gcm.json_request(ids[block:next_block], {"message": message})
            response.setdefault('success', True)

            if self.GCM_RESPONSE_ERRORS in response:
                response['success'] = False
                logging.getLogger().error('Error in the Push Notification: %s', response[self.GCM_RESPONSE_ERRORS])

            if self.GCM_RESPONSE_CANONICAL in response:
                response['success'] = False
                logging.getLogger().info("Canonical ID's: %s", response[self.GCM_RESPONSE_CANONICAL])

            responses.append(response)

        # return a list of all responses
        return responses

    def _push_to_ios(self, message, ids):
        '''
        Apple Push Notifications Service using PyAPNs
        :param str message: Message to be sent
        :param list ids: List of target Registered Device ID's
        :return: A list of response messages (having one response)
        '''
        response = dict()
        response['success'] = True
        try:
            payload = Payload(alert=message, sound="default")
        except PayloadTooLargeError as e:
            response['success'] = False
            # How should we indicate this error
            logging.getLogger().error('Payload too large: %s (%s)', e.payload_size, message)
            return [response]


        for iden in ids:
            try:
                # Not using Frame bulk send because it doesn't catch invalid tokens immediately, which may cause frame notfn to be missed
                self.apns.gateway_server.send_notification(iden, payload)
            except Exception as e:
                # do something about these tokens
                logging.getLogger().error('Error in the Push Notification: %s - %s: %s', iden, type(e), getattr(e, 'message'))
                self._apns = None # Automatically reset the connection if bad Tokens

        # Possibly upto 0.8s to get feedback
        time.sleep(1)
        # Get feedback messages
        # This seems unreliable, have yet to be able to test this functionality
        for (token_hex, fail_time) in self.apns.feedback_server.items(): 
            logging.getLogger().error("Failure for %s at %s", token_hex, fail_time)
            response.setdefault('failures', [])
            response['failures'].append((token_hex, fail_time))

        return [response]
