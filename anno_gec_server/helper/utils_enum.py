class AnnoQueryType(object):
    '''
    Enum class for querying Anno
    '''
    CREATED = "by_created"  # :
    VOTE_COUNT = "by_vote_count"  # :
    FLAG_COUNT = "by_flag_count"  # :
    ACTIVITY_COUNT = "by_activity_count"  # :
    LAST_ACTIVITY = "by_last_activity"  # :
    COUNTRY = "by_country"  # :
    COMMUNITY = "by_community"  # :
    APP = "by_app"  # :
    MY_MENTIONS = "by_my_mentions"  # :
    ARCHIVED = "by_archived"  # :

class AnnoActionType(object):
    CREATED = "created"
    EDITED = "edited"
    DELETED = "deleted"
    COMMENTED = "commented"
    UPVOTED = "upvoted"
    FLAGGED = "flagged"
    TAGGEDUSER = "tagged_user"

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
    ADMIN = "admin"

class InvitationStatusType(object):
    ACCEPTED = "accepted"
    PENDING = "pending"

class PlatformType(object):
    IOS = "iOS"
    ANDROID = "Android"

class SearchIndexName(object):
    ANNO = "anno_index"
    FOLLOWUP = "followup_index"
    TAG = "tag_index"

class AuthSourceType(object):
    ANNO = "Anno"
    GOOGLE = "Google"
    PLUGIN = "Plugin"

class SignInMethod(object):
    ANNO = "anno"
    PLUGIN = "plugin"

class CircleType(object):
    CONTRIBUTOR = "contributor"
    BETA_TESTER = "beta_tester"
    ALPHA_TESTER = "alpha_tester"
    DEVELOPER = "developer"

class CircleValue(object):
    CONTRIBUTOR = 0
    BETA_TESTER = 10
    ALPHA_TESTER = 30
    DEVELOPER = 50

class PlanType(object):
    BASIC = "basic"
    PRO = "pro"
