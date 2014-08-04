import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from message.tag_api_message import TagPopularMessage, TagMessage
from model.tags import Tag
from helper.settings import anno_js_client_id

@endpoints.api(name='tag', version='1.0', description='Tag API',
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class TagApi(remote.Service):

    tag_popular_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        limit=messages.IntegerField(2, required=True)
    )
    tag_search_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        text=messages.StringField(2, required=True)
    )
    
    @endpoints.method(tag_popular_resource_container, TagPopularMessage, path="tag_popular", http_method='GET', name='tag.popular')
    def tag_popular(self, request):
        '''
        Get the most used tags in the system, limited to a number
        '''
        tags = Tag.get_popular_tags(limit=request.limit)
        print tags
        tags = [TagMessage(text=t.text, total=t.total) for t in tags]
        return TagPopularMessage(tags=tags)

    @endpoints.method(tag_search_resource_container, TagPopularMessage, path="tag_search", http_method='GET', name='tag.search')
    def tag_search(self, request):
        '''
        Search for tags in the system based on the Text
        Currently the Search Index is NOT POPULATED
        '''
        tags = Tag.search_tag(request.text)
        tags = [TagMessage(text=t.text, total=t.total) for t in tags]
        return TagPopularMessage(tags=tags)