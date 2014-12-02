__author__ = "rekenerd"

import logging

from model.userannostate import UserAnnoState
from model.userrole import UserRole
from tasks.push_notifications_task import PushTaskQueue
from helper.utils_enum import AnnoActionType
from helper.utils_enum import PlatformType
from helper.utils_enum import AnnoPushNotificationMessage
from helper.utils import APP_NAME

class ActivityPushNotifications():
    IOS_LOC_KEY_FORMAT = "ANNO_{action_type}"
    TITLE_KEY = "title"
    MESSAGE_KEY = "message"
    ANNO_ID_KEY = "anno_id"
    BIG_VIEW_ENABLE = "bigview"
    IOS_MESSAGE_LIMIT = 20


    @classmethod
    def list_deviceid(cls, data_list):
        '''
        Get list of user device ids

        :param list data_list: list of model data with "user" field
        :returns: list of user device ids
        :rtype: list
        '''
        user_deviceids = { PlatformType.IOS: [], PlatformType.ANDROID: [] }

        try:
            user_list = [ data.user.get() for data in data_list ]
            for user in user_list:
                if user.device_id and user.device_type:
                    user_deviceids[user.device_type].append(user.device_id)
        except Exception as e:
            logging.exception("Exception while getting list of user device ids: %s", e)

        return user_deviceids


    @classmethod
    def create_notf_msg(cls, user, anno, action_type, comment):
        '''
        Commbine push notification message for iOS and Android devices

        :param ndb.Model user: "user" datastore
        :param ndb.Model anno: "anno" datastore
        :param str action_type: one of the :py:class:`.AnnoActionType`
        :param str comment: comment made on an anno
        :returns: iOS and Android push notification message
        :rtype: dict
        '''
        user_name = user.display_name

        # "app_name" is removed from new Anno model but it exists for old anno
        # and "app" doesn't
        anno_app_name = getattr(anno, "app_name", None) or anno.app.get().name
        anno_text = comment if action_type == AnnoActionType.COMMENTED else anno.anno_text
        anno_id = anno.key.id()

        ios_msg = cls.create_ios_notf_msg(user_name, anno_text, anno_app_name, anno_id, action_type)
        android_msg = cls.create_android_notf_msg(user_name, anno_text, anno_app_name, anno_id, action_type)

        return { PlatformType.IOS: ios_msg, PlatformType.ANDROID: android_msg }


    @classmethod
    def create_android_notf_msg(cls, user_name, anno_text, anno_app_name, anno_id, action_type):
        '''
        Create push notification message for Android devices

        :param ndb.Model user: "user" datastore
        :param ndb.Model anno: "anno" datastore
        :param str action_type: one of the :py:class:`.AnnoActionType`
        :param str comment: comment made on an anno
        :returns: Android push notification message
        :rtype: tuple
        '''
        msg = getattr(AnnoPushNotificationMessage, action_type.upper(), "")
        msg = unicode(msg).format(user_name=user_name, anno_text=anno_text, action_type=action_type, app_name=anno_app_name)
        return ({ cls.TITLE_KEY: APP_NAME, cls.MESSAGE_KEY: msg, cls.ANNO_ID_KEY: anno_id, cls.BIG_VIEW_ENABLE: "true" }, None)


    @classmethod
    def create_ios_notf_msg(cls, user_name, anno_text, anno_app_name, anno_id, action_type):
        '''
        Create push notification message for iOS devices

        :param ndb.Model user: "user" datastore
        :param ndb.Model anno: "anno" datastore
        :param str action_type: one of the :py:class:`.AnnoActionType`
        :param str comment: comment made on an anno
        :returns: iOS push notification message and id of anno
        :rtype: tuple
        '''
        anno_text = (anno_text[:cls.IOS_MESSAGE_LIMIT] + "...") if (len(anno_text) > cls.IOS_MESSAGE_LIMIT) else anno_text
        msg = dict(loc_key=cls.IOS_LOC_KEY_FORMAT.format(action_type=action_type.upper()),
                   loc_args=[user_name, anno_app_name, anno_text])
        return (msg , { cls.ANNO_ID_KEY: anno_id })


    @classmethod
    def get_noft_devices(cls, first_user, anno, action_type):
        '''
        Get list of device ids to which notification to be sent

        :param ndb.Model first_user: "user" datastore of user who did anno action
        :param ndb.Model anno: "anno" datastore
        :param str action_type: one of the :py:class:`.AnnoActionType`
        :returns: list of device ids for iOS and Android devices
        :rtype: dict
        '''
        interested_user_deviceids = { PlatformType.IOS: [], PlatformType.ANDROID: [] }
        community_manager_deviceids = { PlatformType.IOS: [], PlatformType.ANDROID: [] }

        # get all interested users for anno if action_type is other than "created"
        if action_type != AnnoActionType.CREATED:
            interested_user_list = UserAnnoState.list_users_by_anno(anno_key=anno.key,
                                                                    projection=[UserAnnoState.user, UserAnnoState.last_read])
            interested_user_deviceids = cls.list_deviceid(interested_user_list)

        # anno is in community-scope then send notification to all managers of that community
        if anno.community:
            community_id = anno.community.id()
            community_manager_list = UserRole.community_user_list(community_id=community_id, only_managers=True)
            community_manager_deviceids = cls.list_deviceid(community_manager_list)

        # merging device ids of interested users and community managers
        notf_devices = { platform : list(set(interested_user_deviceids[platform] + community_manager_deviceids[platform]))\
                         for platform in interested_user_deviceids }

        # removing first user from push notification task
        if first_user.device_id and first_user.device_type:
            if first_user.device_id in notf_devices[first_user.device_type]:
                notf_devices[first_user.device_type].remove(first_user.device_id)

        return notf_devices


    @classmethod
    def send_push_notification(cls, first_user, anno, action_type, comment=""):
        '''
        Send push notification for anno actions

        :param ndb.Model first_user: "user" datastore of user who did anno action
        :param ndb.Model anno: "anno" datastore
        :param str action_type: one of the :py:class:`.AnnoActionType`
        :param str comment: comment made on an anno
        '''
        # get list of device ids to which push notification to be sent
        notf_device = cls.get_noft_devices(first_user, anno, action_type)

        # create push notification message for iOS and Android devices
        notf_msg = cls.create_notf_msg(first_user, anno, action_type, comment)

        # if action is "deleted" then delete all UserAnnoState related to that anno
        if action_type == AnnoActionType.DELETED:
            UserAnnoState.delete_by_anno(anno_key=anno.key)

        for platform, devices in notf_device.iteritems():
            message, data = notf_msg[platform]
            if len(devices):
                PushTaskQueue.add(message=message, ids=devices, typ=platform.lower(), data=data)
