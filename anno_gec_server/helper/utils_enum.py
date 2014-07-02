__author__ = "rekenerd"

class AnnoActionType(object):
    CREATED = "created"
    EDITED = "edited"
    DELETED = "deleted"
    COMMENTED = "commented"

class AnnoPushNotificationMessage(object):
    CREATED = "{user_name} created an anno for {app_name}: '{anno_text}'"
    EDITED = "{user_name} edited the anno for {app_name}: '{anno_text}'"
    DELETED = "{user_name} deleted the anno for {app_name}: '{anno_text}'"
    COMMENTED = "{user_name} commented an anno for {app_name}: '{anno_text}'"

class CommunityType(object):
    PRIVATE = "private"
    PUBLIC = "public"
