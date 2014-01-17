import webapp2
from model.FeedbackComment import FeedbackComment

class ImageHandler(webapp2.RequestHandler):
    def get(self):
        """
        handle request for screenshot.

        sample: https://usersource-anno.appspot.com/screenshot?anno_id=5644572721938432
        """
        anno_id = self.request.get('anno_id')
        if anno_id is None or anno_id == '':
            self.response.set_status(400)
            self.response.out.write(u'anno_id parameter is required.')
        else:
            anno = FeedbackComment.get_by_id(long(anno_id))
            if anno is None:
                self.response.set_status(400)
                self.response.out.write('No anno entity with the id "%s" exists.' % anno_id)
            elif anno.image is None:
                self.response.set_status(404)
                self.response.out.write("This anno doesn't contain screenshot")
            else:
                self.response.out.write(anno.image)