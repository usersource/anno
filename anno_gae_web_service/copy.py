
import endpoints

from protorpc import remote
from protorpc import messages
from protorpc import message_types
from model.Votes import Votes
from model.Flags import Flags
from model.FollowUp import FollowUp

from model.FeedbackComment import FeedbackComment

class GetItemsRequest(messages.Message):
    offset = messages.IntegerField(1, required=True)
    limit = messages.IntegerField(2, required=True)

class ItemMessage(messages.Message):
    id = messages.IntegerField(1)
    anno_text = messages.StringField(2, required=True)
    x = messages.FloatField(3, required=True)
    y = messages.FloatField(4, required=True)
    anno_type = messages.StringField(5, default='simple comment')
    is_circle_on_top = messages.BooleanField(6, required=True)
    is_moved = messages.BooleanField(7, required=True)
    level = messages.IntegerField(8, required=True)
    model = messages.StringField(9)
    app_name = messages.StringField(10)
    app_version = messages.StringField(11)
    os_version = messages.StringField(12)
    create_time = message_types.DateTimeField(13)
    user_id = messages.StringField(14)

class GetItemsResponse(messages.Message):
    anno_list = messages.MessageField(ItemMessage, 1, repeated=True)
    
class GetImageRequest(messages.Message):
    anno_id = messages.IntegerField(1, required=True)
    
class GetImageResponse(messages.Message):
    image = messages.BytesField(1)


class AnnoIdRequest(messages.Message):
    anno_id = messages.IntegerField(1, required=True)
class VoteFlagResponse(messages.Message):
    created = message_types.DateTimeField(1)
    creator = messages.StringField(2)
class FollowupResponse(messages.Message):
    comment = messages.StringField(1)
    created = message_types.DateTimeField(2)
    creator = messages.StringField(3)
class ListResponse(messages.Message):
    vote_list = messages.MessageField(VoteFlagResponse, 1, repeated=True)
    flag_list = messages.MessageField(VoteFlagResponse, 2, repeated=True)
    followup_list = messages.MessageField(FollowupResponse, 3, repeated=True)

@endpoints.api(name="copy_api", 
               version="v1", 
               description="Copy data api", 
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID])
class CopyApi(remote.Service):
    @endpoints.method(AnnoIdRequest, ListResponse, path="copyvote", http_method="GET", name="copy.vote_list")
    def getVotes(self, request):
        fc = FeedbackComment.get_by_id(request.anno_id)
        if fc is None:
            print "No followups for anno - " + str(request.anno_id)
            return ListResponse(vote_list=[])
        votes = Votes.all().filter("feedback_key = ", fc.key())
        results = []
        for vote in votes:
            result = VoteFlagResponse()
            result.created = vote.updateTimestamp
            result.creator = vote.user_id.user_name
            results.append(result)
        return ListResponse(vote_list=results)

    @endpoints.method(AnnoIdRequest, ListResponse, path="copyflag", http_method="GET", name="copy.flag_list")
    def getFlags(self, request):
        fc = FeedbackComment.get_by_id(request.anno_id)
        if fc is None:
            print "No followups for anno - " + str(request.anno_id)
            return ListResponse(flag_list=[])
        flags = Flags.all().filter("feedback_key = ", fc.key())
        results = []
        for flag in flags:
            result = VoteFlagResponse()
            result.created = flag.updateTimestamp
            result.creator = flag.user_id.user_name
            results.append(result)
        return ListResponse(flag_list=results)


    @endpoints.method(AnnoIdRequest, ListResponse, path="copyfollowup", http_method="GET", name="copy.followup_list")
    def getFollowups(self, request):
        fc = FeedbackComment.get_by_id(request.anno_id)
        if fc is None:
            print "No followups for anno - " + str(request.anno_id)
            return ListResponse(followup_list=[])
        followups = FollowUp.all().filter("Feedback_key = ", fc.key())
        results = []
        for followup in followups:
            result = FollowupResponse()
            result.created = followup.updateTimestamp
            result.creator = followup.user_id.user_name
            result.comment = followup.comment
            results.append(result)
        return ListResponse(followup_list=results)


    @endpoints.method(GetItemsRequest,
                      GetItemsResponse, 
                      path="copy", 
                      http_method='GET', 
                      name='copy.anno_list')
    def getItems(self, request):
        result = []
        anno_item = None
        
        model = FeedbackComment.all()
        for item in model.order('updateTimestamp').run(offset=request.offset, limit=request.limit):
            anno_item = ItemMessage()
            anno_item.id = item.key().id()
            anno_item.anno_text = item.comment
            anno_item.x = float(item.x)
            anno_item.y = float(item.y)
            anno_item.app_name = item.app_name
            anno_item.anno_type = item.anno_type
            anno_item.app_version = item.app_version
            
            if item.direction == "0":
                anno_item.is_circle_on_top = True
            else:
                anno_item.is_circle_on_top = False
                
            if item.isMoved == "1":
                anno_item.is_moved = True
            else:
                anno_item.is_moved = False
                    
            anno_item.level = item.level
            anno_item.model = item.model
            anno_item.os_version = item.os_version
            anno_item.create_time = item.updateTimestamp 
            anno_item.user_id = item.user_id.user_name
            result.append(anno_item)
            
        return GetItemsResponse(anno_list=result)
    
    @endpoints.method(GetImageRequest, 
                      GetImageResponse, 
                      path="copy", 
                      http_method='POST', 
                      name='copy.image')
    def getImage(self, request):
        result = GetImageResponse()
        item = FeedbackComment.get_by_id(request.anno_id)
        if item != None:
            result.image = item.image
    
        return result
    
    
copy_api = endpoints.api_server([CopyApi], restricted=False)      
