__author__ = "rekenerd"

class AnnoQueryType(object):
    '''
    Enum class for querying Anno
    '''
    CREATED = "by_created" #:
    VOTE_COUNT = "by_vote_count" #:
    FLAG_COUNT = "by_flag_count" #:
    ACTIVITY_COUNT = "by_activity_count" #:
    LAST_ACTIVITY = "by_last_activity" #:
    COUNTRY = "by_country" #:
    COMMUNITY = "by_community" #:

class AnnoActionType(object):
    CREATED = "created"
    EDITED = "edited"
    DELETED = "deleted"
    COMMENTED = "commented"

class AnnoPushNotificationMessage(object):
    CREATED = "{user_name} created an anno for {app_name}: '{anno_text}'"
    EDITED = "{user_name} edited the anno for {app_name}: '{anno_text}'"
    DELETED = "{user_name} deleted the anno for {app_name}: '{anno_text}'"
    COMMENTED = "{user_name} commented on anno for {app_name}: '{anno_text}'"

class CommunityType(object):
    PRIVATE = "private"
    PUBLIC = "public"

class UserRoleType(object):
    MEMBER = "member"
    MANAGER = "manager"

class InvitationStatusType(object):
    ACCEPTED = "accepted"
    PENDING = "pending"

class DeviceType(object):
    IOS = "iOS"
    ANDROID = "Android"
