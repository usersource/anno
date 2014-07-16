__author__ = "rekenerd"

import endpoints
from protorpc import message_types
from protorpc import messages
from protorpc import remote

from helper.settings import anno_js_client_id
from model.anno import Anno
from model.userannostate import UserAnnoState

@endpoints.api(name="userannostate", version="1.0", description="UserAnnoState API",
               allowed_client_ids=[endpoints.API_EXPLORER_CLIENT_ID, anno_js_client_id])
class UserAnnoStateApi(remote.Service):

    notify_state_resource_container = endpoints.ResourceContainer(
        message_types.VoidMessage,
        anno_id=messages.IntegerField(2),
        notify=messages.BooleanField(3)
    )

    @endpoints.method(notify_state_resource_container, message_types.VoidMessage, path="notify/update",
                      http_method="POST", name="userannostate.notify.update")
    def update_notify(self, request):
        user = auth_user(self.request_state.headers)
        anno = Anno.get_by_id(request.anno_id)
        entity = UserAnnoState.get(user=user, anno=anno)

        if entity:
            entity.notify = request.notify
            entity.put()

        return message_types.VoidMessage()
