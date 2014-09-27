__author__ = 'topcircler'

import webapp2

from model.anno import Anno


class ImageHandler(webapp2.RequestHandler):
    HEADER_PNG = [chr(0x89), chr(0x50), chr(0x4E), chr(0x47)]
    HEADER_JPG = [chr(0xFF), chr(0xD8)]
    MAX_AGE = 30*24*60*60

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
            # is this an if-modified request
            if_modified_since =  self.request.headers.get('If-Modified-Since')
            if_none_match =  self.request.headers.get('If-None-Match')

            # Reply with a 304
            # we could guess that if the Anno image was never modified
            # we do not even have to read the database and return a 304
            # if (if_modified_since is not None and if_modified_since == anno.created.isoformat()) or \
            #     (if_none_match is not None and if_none_match == anno.created.isoformat()):

            # We trust the request blindly to save to DB read time
            if if_modified_since or if_none_match:
                self.response.status = 304
                return

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

                # Cache control and ETag support
                self.response.headers['Cache-Control'] = 'max-age=%d, public'%self.MAX_AGE
                self.response.headers['Last-Modified'] = anno.created.isoformat()
                self.response.headers['ETag'] = anno.created.isoformat()

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

