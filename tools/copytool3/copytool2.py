__author__ = 'lren'

from apiclient.discovery import build
import base64


class sourceServer(object):
    SOURCE_DISCOVERY_SERVICE_URL = "https://annoserver-test.appspot.com/_ah/api/discovery/v1/apis/copy_api/v1/rest"
    source_server = build("copy_api", "v1", discoveryServiceUrl=SOURCE_DISCOVERY_SERVICE_URL)
    items = []
    offset = 0
    limit = 100

    def get_next_anno(self):
        result = None
        if len(self.items) == 0:
            response = self.source_server.copy().anno_list(offset=self.offset, limit=self.limit).execute()
            if response.has_key("anno_list"):
                self.items = response["anno_list"]
                self.offset += self.limit
        if len(self.items) != 0:
            result = self.items.pop()
            result["device_model"] = result["model"]
            del result["model"]
            result["simple_x"] = result["x"]
            del result["x"]
            result["simple_y"] = result["y"]
            del result["y"]
            result["simple_is_moved"] = result["is_moved"]
            del result["is_moved"]
            result["simple_circle_on_top"] = result["is_circle_on_top"]
            del result["is_circle_on_top"]
            result["created"] = result["create_time"]
            del result["create_time"]
            result["creator_id"] = result["user_id"]
            print "Load image for item: " + result["anno_text"]
            response = self.source_server.copy().image(body={"anno_id": result["id"]}).execute()
            if response.has_key("image"):
                decoded = base64.urlsafe_b64decode(str(response["image"]))
                result["image"] = base64.standard_b64encode(decoded)
        return result

    def get_votes(self, anno_id):
        response = self.source_server.copy().vote_list(anno_id=anno_id).execute()
        if response.has_key("vote_list"):
            return response["vote_list"]
        else:
            return []

    def get_flags(self, anno_id):
        response = self.source_server.copy().flag_list(anno_id=anno_id).execute()
        if response.has_key("flag_list"):
            return response["flag_list"]
        else:
            return []

    def get_followups(self, anno_id):
        response = self.source_server.copy().followup_list(anno_id=anno_id).execute()
        if response.has_key("followup_list"):
            return response["followup_list"]
        else:
            return []


class targetServer(object):
    TARGET_DISCOVERY_ANNO_SERVICE_URL = "https://usersource-anno.appspot.com/_ah/api/discovery/v1/apis/anno/1.0/rest"
    TARGET_DISCOVERY_VOTE_SERVICE_URL = "https://usersource-anno.appspot.com/_ah/api/discovery/v1/apis/vote/1.0/rest"
    TARGET_DISCOVERY_FLAG_SERVICE_URL = "https://usersource-anno.appspot.com/_ah/api/discovery/v1/apis/flag/1.0/rest"
    TARGET_DISCOVERY_FOLLOWUP_SERVICE_URL = "https://usersource-anno.appspot.com/_ah/api/discovery/v1/apis/followup/1.0/rest"
    anno_target_server = build("anno", "v1", discoveryServiceUrl=TARGET_DISCOVERY_ANNO_SERVICE_URL)
    vote_target_server = build("vote", "v1", discoveryServiceUrl=TARGET_DISCOVERY_VOTE_SERVICE_URL)
    flag_target_server = build("flag", "v1", discoveryServiceUrl=TARGET_DISCOVERY_FLAG_SERVICE_URL)
    followup_target_server = build("followup", "v1", discoveryServiceUrl=TARGET_DISCOVERY_FOLLOWUP_SERVICE_URL)

    def save_anno(self, item):
        response = self.anno_target_server.anno().insert(body=item).execute()
        return response["id"]

    def save_flag(self, flag, anno_id):
        flag["anno_id"] = anno_id
        flag["user_email"] = flag["creator"]
        del flag["creator"]
        self.flag_target_server.flag().insert(body=flag).execute()

    def save_vote(self, vote, anno_id):
        vote["anno_id"] = anno_id
        vote["user_email"] = vote["creator"]
        del vote["creator"]
        self.vote_target_server.vote().insert(body=vote).execute()

    def save_followup(self, followup, anno_id):
        followup["anno_id"] = anno_id
        followup["user_email"] = followup["creator"]
        del followup["creator"]
        self.followup_target_server.followup().insert(body=followup).execute()


source = sourceServer()
target = targetServer()

print "start copying from annoserver-test to usersource-anno"
anno = source.get_next_anno()
i = 0
while anno is not None:
    print "copy " + str(i) + ":" + anno["anno_text"]
    anno_id_inserted = target.save_anno(anno)
    print "anno inserted: id=" + anno_id_inserted
    flag_list = source.get_flags(anno["id"])
    print "flag list size:" + str(len(flag_list))
    if len(flag_list) > 0:
        for flag in flag_list:
            target.save_flag(flag, anno_id_inserted)
    vote_list = source.get_votes(anno["id"])
    print "vote list size:" + str(len(vote_list))
    if len(vote_list) > 0:
        for vote in vote_list:
            target.save_vote(vote, anno_id_inserted)
    followup_list = source.get_followups(anno["id"])
    print "follow up list size:" + str(len(followup_list))
    if len(followup_list) > 0:
        for followup in followup_list:
            target.save_followup(followup, anno_id_inserted)
    print "----------------------------------------------------"
    i += 1
    anno = source.get_next_anno()
print "Done."

