__author__ = 'topcircler'

import webapp2

from model.anno import Anno


class ImageHandler(webapp2.RequestHandler):
    HEADER_PNG = [chr(0x89), chr(0x50), chr(0x4E), chr(0x47)]
    HEADER_JPG = [chr(0xFF), chr(0xD8)]

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
            anno = Anno.get_by_id(long(anno_id))
            if anno is None:
                self.response.set_status(400)
                self.response.out.write('No anno entity with the id "%s" exists.' % anno_id)
            elif anno.image is None:
                self.response.set_status(404)
                self.response.out.write("This anno doesn't contain screenshot")
            else:
                # Header identifier
                head = list(anno.image[:32])

                if self.HEADER_PNG == head[:len(self.HEADER_PNG)]:
                    # PNG Header
                    self.response.headers['Content-Type'] = 'image/png'
                elif self.HEADER_JPG == head[:len(self.HEADER_JPG)]:
                    # JPEG Header
                    self.response.headers['Content-Type'] = 'image/jpeg'
                else:
                    # Defaulting to BMP for now
                    self.response.headers['Content-Type'] = 'image/bmp'

                self.response.out.write(anno.image)
