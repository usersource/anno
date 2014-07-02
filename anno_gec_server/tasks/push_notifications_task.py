import json, logging, math, time
from settings import APNS_PUSH_CERT, APNS_PUSH_KEY, APNS_USE_SANDBOX, APNS_ENHANCED, GCM_API_KEY


from gcm import GCM
from PyAPNs.apns import APNs, Payload, PayloadAlert, PayloadTooLargeError

import webapp2
from google.appengine.api import taskqueue


class PushTaskQueue(object):
    '''
    Wrapper to add Tasks to the Push Queue
    '''
    QUEUE_URL = '/push'

    @classmethod
    def add(cls, message, ids, typ, data=None):
        '''
        Add a job to the Task Queue
        '''
        ids = json.dumps(ids) if type(ids) is list else ids
        message = json.dumps(message) if type(message) is dict else message
        data = json.dumps(data) if type(data) is dict else data
        taskqueue.add(url=cls.QUEUE_URL, params={'message': message, 'ids': ids, 'type': typ, 'data': data})

class PushHandler(webapp2.RequestHandler):
    '''
    A TaskQueue request handler targeted at scaling push notifications
    '''

    def __init__(self, *args, **kargs):
        self.pusher = PushService(gcm_apikey=GCM_API_KEY, apns_push_key=APNS_PUSH_KEY, apns_push_cert=APNS_PUSH_CERT, 
            apns_use_sandbox=APNS_USE_SANDBOX, apns_enhanced=APNS_ENHANCED)
        super(PushHandler, self).__init__(*args, **kargs)

    def post(self):
        '''
        TaskQueue Additions are pushed in through this post request
        '''
        message = self.request.get('message')
        typ = self.request.get('type')
        data = self.request.get('data')

        try:
            message = json.loads(message)
        except (ValueError, TypeError) as e:
            logging.getLogger().debug("Message not decoded %s", message)

        try:
            data = json.loads(data)
        except ValueError:
            data = {}

        try:
            ids = json.loads(self.request.get('ids'))
        except (TypeError, ValueError):
            logging.getLogger().exception("Error while JSON parsing Registration ID's")
            self.response.out.write(json.loads(dict(success=False)))

        res = self.pusher.push(typ, message, ids, data)
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

    def __init__(self, gcm_apikey=None, apns_push_cert=None, apns_push_key=None, 
        apns_use_sandbox=False, apns_enhanced=False):
        '''
        Constructor
        :param str gcm_apikey: The GCM APIKey
        :param str apns_push_cert: The file path to the APNS Certificate .pem file
        :param str apns_push_key: The file path to the APNS Key .pem file
        '''
        self.gcm_key = gcm_apikey
        self.apns_push_cert = apns_push_cert
        self.apns_push_key = apns_push_key
        self.apns_enhanced = apns_enhanced
        self.apns_use_sandbox = apns_use_sandbox
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
            self._apns = APNs(use_sandbox=self.apns_use_sandbox, cert_file=self.apns_push_cert, key_file=self.apns_push_key, enhanced=self.apns_enhanced)
            if self.apns_use_sandbox:
                self._apns.gateway_server.register_response_listener(self._apns_response_listener)
        return self._apns

    def _apns_response_listener(self, error):
        logging.getLogger().error("Error Response for APNS: %s", error)

    def push(self, typ, message, ids, data):
        '''
        Use this method to initiate push notifications to either
        Apple or Android devices
        :param str typ: Represents the type of Registration ID's used (either ios or android)
        :param str message: The text message to be displayed on the Client Devices
        :param list ids: A list of target Registered Device ID's
        :param dict data: Dictionary of custom data items
        '''
        if typ == self.TYPE_ANDROID:
            return self._push_to_android(message, ids)
        elif typ == self.TYPE_IOS:
            return self._push_to_ios(message, ids, data)
        return dict(success=False, reason=("Unknown Type %s"%(typ)))

    def _push_to_android(self, message, ids):
        '''
        Google Cloud Messaging Push Notifications using python-gcm
        :param dict message: Message to be sent in JSON
        :param list ids: List of target Registered Device ID's
        :return: A list of response messages (due to chunking constraints)
        '''
        responses = []

        # blocks of self.GCM_MAX_BULK
        blocks = int(math.ceil(float(len(ids))/self.GCM_MAX_BULK))
        for b in range(blocks):
            block = b * self.GCM_MAX_BULK
            next_block = block + self.GCM_MAX_BULK

            response = self.gcm.json_request(ids[block:next_block], message)
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

    def _push_to_ios(self, message, ids, data):
        '''
        Apple Push Notifications Service using PyAPNs
        :param str/dict message: Message to be sent
        :param list ids: List of target Registered Device ID's
        :param dict data: Dictionary of custom data items
        :return: A list of response messages (having one response)
        '''
        response = dict()
        response['success'] = True
        alert = ''
        try:
            alert = message.pop('alert', '')
            message = PayloadAlert(alert, **message)
        except ValueError:
            # Not a hash of data
            pass

        try:
            payload = Payload(message, sound="default", custom=data)
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
