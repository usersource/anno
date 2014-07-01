__author__ = "rekenerd"

from model.userannostate import UserAnnoState
from model.userrole import UserRole
from tasks.push_notifications_task import PushTaskQueue

class ActivityNotifications():
    @classmethod
    def list_deviceid(cls, user_list):
        user_deviceids = dict(iOS=[], Android=[])
        user_list = [ user.user.get() for user in user_list ]
        for user in user_list:
            if user.device_id:
                user_deviceids[user.device_type].append(user.device_id)

        return user_deviceids
    
    @classmethod
    def create_notf_msg(cls, user_name, anno_text, action_type, comment):
        msg = ""
        if action_type in ["create", "edited", "deleted"]:
            msg = "{user_name} has {action_type} a Anno: {anno_text}"
            msg = msg.format(user_name=user_name, action_type=action_type, anno_text=anno_text)
        elif action_type == "commented":
            msg = "{user_name} has commented on a Anno: {comment}"
            msg = msg.format(user_name=user_name, comment=comment)

        return msg

    @classmethod
    def get_noft_devices(cls, first_user, anno, action_type):
        interested_user_deviceids = dict(iOS=[], Android=[])
        community_managers_deviceids = dict(iOS=[], Android=[])

        # action_type for which notification will sent:
        # "created", "edited", "deleted", "commented"

        # get all interested users for anno if action_type is other than "created"
        if action_type != "created":
            interested_user = UserAnnoState.list_by_anno(anno.key.id())
            interested_user_deviceids = cls.list_deviceid(user_list=interested_user)

        # anno is in community-scope then send notification to all managers of that community
        if anno.community:
            community_managers = UserRole.community_user_list(community_id=anno.community.id(),
                                                              only_managers=True)
            community_managers_deviceids = cls.list_deviceid(user_list=community_managers)

        notf_devices = dict(iOS=interested_user_deviceids["iOS"] + community_managers_deviceids["iOS"],
                            Android=interested_user_deviceids["Android"] + community_managers_deviceids["Android"])

        # remove first_user
        if first_user.device_id in notf_devices[first_user.device_type]:
            notf_devices[first_user.device_type].remove(first_user.device_id)

        return notf_devices
        
    @classmethod
    def send_notifications(cls, first_user, anno, action_type, comment=""):
        notf_device = cls.get_noft_devices(first_user, anno, action_type)
        notf_msg = cls.create_notf_msg(user_name=first_user.display_name, anno_text=anno.anno_text,
                                       action_type=action_type, comment=comment)

        if action_type == "deleted":
            UserAnnoState.delete_by_anno(anno.key.id())

        for platform, devices in notf_device.iteritems():
            PushTaskQueue.add(message=notf_msg, ids=devices, typ=platform.lower())
