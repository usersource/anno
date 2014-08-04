import logging

from google.appengine.ext import ndb
from google.appengine.api import search

from helper.utils_enum import SearchIndexName

class Tag(ndb.Model):
    """
    Represents hashtag entities.
    Hastag's will consist of Text(String, of the tag used) and Total(Integer, uses in the system)

    Notice how the class name 'Tag' is used in some places
    and the class identifier 'cls' is used in others
    This is to allow easy bifurcation of code into a seperate DAL class later on
    So that the Access Layer can be removed from the Model
    """
    text = ndb.StringProperty(indexed=True)  # this field should be unique.
    total = ndb.IntegerProperty(indexed=True) # Index so that popular tag counts can be queried fast

    @classmethod
    def get_tag_by_text(cls, text):
        '''
        A non fuzzy search for tags by text
        '''
        return cls.query(Tag.text==text).get() # should be unique, so why overwork

    @classmethod
    def search_tag(cls, text):
        '''
        A very Sub Standard search query to search the Search Documents
        for a tag based on Text
        '''
        index = search.Index(name=SearchIndexName.TAG)
        q = "text:%s"%text
        ret = None
        try:
            results = index.search(q)
            ret = [ndb.Key(Tag, int(r.doc_id)) for r in results] # make a list of key ids
        except search.Error:
            logging.getLogger().exception("Search for tag %s failed", text)

        # We want Tags
        if ret is not None: 
            ret = ndb.get_multi(ret)
            
        print ret
        return ret

    @classmethod
    def get_popular_tags(cls, limit=10):
        '''
        Get the popular tags by cumulative usage in the system
        '''
        return cls.query().order(-Tag.total).fetch(limit=limit)

    @classmethod
    def insert_tag(cls, text=None, total=1):
        '''
        Insert a tag, if the text exists then simply increment its total
        '''
        tag = None
        if text is not None:
            tag = Tag.get_tag_by_text(text)

        if tag is not None:
            tag.total = tag.total + total
            tag.put()
        elif text is not None: # again
            tag = Tag(text=text, total=total)
            tag.put()
            # Leave out the indexed search documents for now
            #cls.insert_tag_document(key=tag.key.id(), text=text)

        return tag

    @classmethod
    def add_tag_total(cls, text=None, total=1):
        '''
        Add 'total' to the Tag Entity that matches
        the 'text' of the Tag
        '''
        return Tag.insert_tag(text=text, total=total)

    @classmethod
    def insert_tag_document(cls, key, text):
        '''
        Insert a tag's text into a search document
        with only the 'text' to search on
        '''
        doc = search.Document(doc_id="%d"%key,
            fields=[search.TextField(name='text', value=text)])

        index = search.Index(name=SearchIndexName.TAG)
        index.put(doc)

        return doc