__author__ = "rekenerd"

import logging

from model.userannostate import UserAnnoState
from model.userrole import UserRole
from tasks.push_notifications_task import PushTaskQueue

class ActivityPushNotifications():
    IOS_LOC_KEY_FORMAT = "ANNO_{action_type}"
    MESSAGE_KEY = "message"
    ANNO_ID_KEY = "anno_id"

    @classmethod
    def list_deviceid(cls, user_list):
        user_deviceids = dict(iOS=[], Android=[])

        try:
            user_list = [ user.user.get() for user in user_list ]
            for user in user_list:
                if user.device_id:
                    user_deviceids[user.device_type].append(user.device_id)
        except Exception as e:
            logging.exception("Exception while getting list of user device ids: %s", e)

        return user_deviceids

    @classmethod
    def create_notf_msg(cls, user, anno, action_type, comment):
        user_name = user.display_name
        # "app_name" is removed in new Anno model
        anno_app_name = getattr(anno, "app_name", None) or anno.app.get().name
        anno_text = comment if action_type == "commented" else anno.anno_text
        anno_id = anno.key.id()

        ios_msg = cls.create_ios_notf_msg(user_name, anno_text, anno_app_name, anno_id, action_type)
        android_msg = cls.create_android_notf_msg(user_name, anno_text, anno_app_name, anno_id, action_type)
        return dict(iOS=ios_msg, Android=android_msg)

    @classmethod
    def create_android_notf_msg(cls, user_name, anno_text, anno_app_name, anno_id, action_type):
        msg = ""

        if action_type in ["created", "edited", "deleted"]:
            msg = "{user_name} {action_type} an anno for {app_name}: '{anno_text}'"
        elif action_type == "commented":
            msg = "{user_name} commented on an anno for {app_name}: '{anno_text}'"

        msg = msg.format(user_name=user_name, anno_text=anno_text, action_type=action_type, app_name=anno_app_name)
        return ({ cls.MESSAGE_KEY: msg, cls.ANNO_ID_KEY: anno_id }, None)

    @classmethod
    def create_ios_notf_msg(cls, user_name, anno_text, anno_app_name, anno_id, action_type):
        anno_text = (anno_text[:20] + "...") if (len(anno_text) > 20) else anno_text
        msg = dict(loc_key=cls.IOS_LOC_KEY_FORMAT.format(action_type=action_type.upper()),
                   loc_args=[user_name, anno_app_name, anno_text])
        return (msg , { cls.ANNO_ID_KEY: anno_id })

    @classmethod
    def get_noft_devices(cls, first_user, anno, action_type):
        interested_user_deviceids = dict(iOS=[], Android=[])
        community_managers_deviceids = dict(iOS=[], Android=[])

        # action_type for which notification will sent:
        # "created", "edited", "deleted", "commented"

        # get all interested users for anno if action_type is other than "created"
        if action_type != "created":
            interested_user_list = UserAnnoState.list_by_anno(anno.key.id())
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
        if first_user.device_id in notf_devices[first_user.device_type]:
            notf_devices[first_user.device_type].remove(first_user.device_id)

        return notf_devices
        
    @classmethod
    def send_notifications(cls, first_user, anno, action_type, comment=""):
        notf_device = cls.get_noft_devices(first_user, anno, action_type)
        notf_msg = cls.create_notf_msg(first_user, anno, action_type, comment)

        # if action is "deleted" then delete all UserAnnoState related to that anno
        if action_type == "deleted":
            UserAnnoState.delete_by_anno(anno.key.id())

        for platform, devices in notf_device.iteritems():
            message, data = notf_msg[platform]
            if len(devices):
                PushTaskQueue.add(message=message, ids=devices, typ=platform.lower(), data=data)
