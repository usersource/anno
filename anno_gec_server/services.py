__author__ = 'topcircler'

import endpoints

from api.vote_api import VoteApi
from api.anno_api import AnnoApi
from api.flag_api import FlagApi
from api.followup_api import FollowupApi
from api.user_api import UserApi
from api.account_api import AccountApi
from api.util_api import UtilApi
from api.community_api import CommunityApi
from api.userrole_api import UserRoleApi
from api.appinfo_api import AppInfoApi

api_list = [VoteApi, AnnoApi, FlagApi, FollowupApi, UserApi, AccountApi, UtilApi,
            CommunityApi, AppInfoApi]
APPLICATION = endpoints.api_server(api_list, restricted=False)
