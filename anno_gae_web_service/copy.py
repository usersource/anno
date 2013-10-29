
import endpoints

from protorpc import remote
from protorpc import messages
from protorpc import message_types

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

class GetItemsResponse(messages.Message):
    anno_list = messages.MessageField(ItemMessage, 1, repeated=True)
    
class GetImageRequest(messages.Message):
    anno_id = messages.IntegerField(1, required=True)
    
class GetImageResponse(messages.Message):
    image = messages.BytesField(1)
    

@endpoints.api(name="copy_api", 
               version="v1", 
               description="Copy data api", 
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID])
class CopyApi(remote.Service):
    
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