from model.appinfo import AppInfo
from helper.utils_enum import DeviceType

from urllib2 import urlopen, URLError
from urllib import urlencode, quote
from HTMLParser import HTMLParser
from xml.etree import ElementTree
import re

import json
import logging

class StoreTypeEnum:
	PLAY_STORE = "PlayStore"
	APP_STORE = "AppStore"

class CountryEnum:
	US = 'us'

class PlayStoreCollectionEnum:
	TOP_SELLING_FREE = "topselling_free"
	TOP_SELLING_PAID = "topselling_paid"
	TOP_GROSSING = "topgrossing"
	TOP_SELLING_NEW_FREE = "topselling_new_free"
	TOP_SELLING_NEW_PAID = "topselling_new_paid"

class AppStoreRSSTypeEnum:
	TOP_FREE = 'topfreeapplications'
	NEW_FREE = 'newfreeapplications'
	NEW_PAID = 'newpaidapplications'
	NEW_APPS = 'newapplications'
	TOP_GROSSING = 'topgrossingapplications'
	TOP_PAID = 'toppaidapplications'

class AppStoreRSSGenreEnum:
	ALL = None
	BOOKS = 6018
	BUSINESS = 6000
	CATALOGS = 6022
	EDUCATION = 6017
	ENTERTAINMENT = 6016
	FINANCE = 6015
	FOOD_AND_DRINK = 6023
	GAMES = 6014
	HEALTH_AND_FITNESS = 6013
	LIFESTYLE = 6012
	MEDICAL = 6020
	MUSIC = 6011
	NAVIGATION = 6010
	NEWS = 6009
	NEWSSTAND = 6021
	PHOTO_AND_VIDEO = 6008
	PRODUCTIVITY = 6007
	REFERENCE = 6006
	SOCIAL_NETWORKING = 6005
	SPORTS = 6004
	TRAVEL = 6003
	UTILITIES = 6002
	WEATHER = 6001

class QueryTypeEnum:
	SEARCH = "Search"
	FETCH = "Fetch"


class GooglePlayStoreScraper(HTMLParser):
	'''
	A Google Play store Parser based on the inbuilt Python HTMLParser
	So that no other dependencies are required
	Use Class methods `fetch` or `search` to get Raw Data
	Provide this data to an OBJECT of this class via the `feed` method
	Thereafter the App List will be available in the `apps` object attribute
	'''
	PLAY_STORE_URL = "https://play.google.com/store/apps/collection/{collection}"
	PLAY_STORE_SEARCH_URL = "https://play.google.com/store/search?q={term}&c=apps"

	def __init__(self):
		self._current_app = None
		self.APP_STATE = None
		self.apps = []
		HTMLParser.__init__(self)

	@classmethod
	def fetch(cls, collection='topselling_free', start=0, num=0, **kargs):
		'''
		Fetch the data from a given or default URL
		:param str collection: The type of collection to query (top, paid, free, etc..)
		:param int start: For paging purposes, skip these many results in the query
		:param int num: The number of results to query for
		:param str url: If provided, overwrites the default Query URL
		:return: String result or None if URLException
		'''
		try:
			body = [('xhr', 1), ('ipf', 1)]
			if start: body.append(('start', start))
			if num: body.append(('num', num))

			# Either default URL, or one that is provided
			url = kargs.get('url', cls.PLAY_STORE_URL.format(collection=collection))

			body = urlencode(body)
			data = urlopen(url, data=body)
		except URLError as e:
			logging.getLogger().exception("Error in Play Store Query url:%s, collection:%s, start:%s, num:%s, kargs:%s, Reply:%s", \
				url, collection, start, num, kargs, e.read())
			return None

		return data.read()

	@classmethod
	def search(cls, term):
		'''
		Query a Search term website scrape
		:param str term: The search term to query for
		'''
		return cls.fetch(url=cls.PLAY_STORE_SEARCH_URL.format(term=quote(term)))

	
	# Below are overridden HTMLParser methods, to be used internally only
	# They are invoked when Data is provided to the Object via the 'feed' method

	def handle_starttag(self, tag, attrs):
		# convert list of tuples into easily referencable dict
		attrs_d = dict(attrs)

		# We have an App Card, <div class='card ... app' ...>
		if tag == 'div' and re.search('card.+app', attrs_d.get('class', '')): 
			#print attrs_d['data-docid'],
			# Overwrite any App we are currently on, it will remain in the Apps list
			self._current_app = dict(docid=attrs_d['data-docid'])

			# insert the current App, all changes to the above object will reflect in the list
			self.apps.append(self._current_app)

		# The App store link
		elif tag == 'a' and attrs_d.get('class') == 'card-click-target':
			self._current_app['link'] = 'https://play.google.com' + attrs_d.get('href', '/no-link-found')

		# The App title
		elif tag == 'a' and attrs_d.get('class') == 'title' and attrs_d.has_key('title'):
			self._current_app['name'] = attrs_d.get('title')

		# The App Images
		elif tag == 'img' and attrs_d.get('class') == 'cover-image':
			self._current_app['image-large'] = attrs_d.get('data-cover-large')
			self._current_app['image-small'] = attrs_d.get('data-cover-small')

		# The App developer
		elif tag == 'a' and attrs_d.get('class') == 'subtitle':
			self._current_app['developer'] = attrs_d.get('title')

		elif tag == 'button' and attrs_d.get('class') == 'price buy':
			self._current_app['price'] = None # The next span will have the price, see handle_data

		# Description is a layer of nested p-tags within this div
		# So maintain state and keep adding description text while the flag is active
		elif tag == 'div' and attrs_d.get('class') == 'description':
			self.APP_STATE = 'in-description'
			self._current_app['description'] = ""



	def handle_endtag(self, tag):
		# DEscription div tag has ended, undo flag
		if self.APP_STATE == 'in-description' and tag == 'div':
			self.APP_STATE = None

	def handle_data(self, data):
		# Blech, get the price
		if self._current_app and self._current_app.has_key('price') and self._current_app.get('price') is None \
			and re.search('[0-9]+', data):
			self._current_app['price'] = data

		# While the flag is active, all data is part of the description
		elif self.APP_STATE == 'in-description' and self._current_app.has_key('description'):
			self._current_app['description'] += (' ' + data)

class iTunesAppStoreRSSAndSearch(object):
	'''
	iTunes RSS feed parser for Top 100, Top Paid, Top Grossing, etc... Apps
	All methods are class methods, there is no need to instatiate the Class
	'''
	ITUNES_BASIC_URL = 'https://itunes.apple.com/{country}/rss/{rss_type}/limit={limit}/xml'
	ITUNES_GENRE_URL = 'https://itunes.apple.com/{country}/rss/{rss_type}/limit={limit}/genre={genre_id}/xml'
	ITUNES_SEARCH_URL = 'https://itunes.apple.com/search?term={term}&country={country}&media=software&media=software&limit={limit}'

	@classmethod
	def fetch(cls, country='us', rss_type='topfreeapplications', limit=100, genre_id=None, **kargs):
		'''
		Fetch the xml content from the RESTful URL using the given parameters
		:param str country: Which country to Query Apps for (eg: us)
		:param str rss_type: The collection type of the rss to query (eg: top, etc..)
		:param int limit: Maximum results to return, 10-100 for RSS URLs
		:param str genre_id: The ID of the genre to query for (eg: "60018")
		:param str url: If provided, overwrites the default URL used for the query
		:return str: The raw data returned from the query or None
		'''
		url = kargs.get('url')
		if not url:
			url = cls.ITUNES_BASIC_URL.format(country=country, rss_type=rss_type, limit=limit) if not genre_id else \
				cls.ITUNES_GENRE_URL.format(country=country, rss_type=rss_type, limit=limit, genre_id=genre_id)

		try:
			data = urlopen(url)
		except URLError as e:
			logging.getLogger().exception("Error in App Store Query url:%s, rss_type:%s, limit:%s, genre:%s, kargs:%s, Reply:%s", \
				url, rss_type, limit, genre_id , kargs, e.read())
			return None

		return data.read()

	@classmethod
	def search(cls, term, country='us', limit=50):
		'''
		Do an iTunes Search via the iTunes Search API
		https://www.apple.com/itunes/affiliates/resources/documentation/itunes-store-web-service-search-api.html
		:param str term: The search term to query for
		:param str country: The country to query the search API with (eg: us)
		:param int limit: The maximum number of results to query for, 1-200
		:return: a json string or None
		'''
		data = cls.fetch(url=cls.ITUNES_SEARCH_URL.format(term=quote(term), country=quote(country), limit=limit))
		return data

	@classmethod
	def parse_xml(cls, xml_data):
		'''
		Parse fetched xml data
		Return a list of Apps in order of appearance
		:param str xml_data: Should be correct XML Data in the iTunes RSS format
		:return: A list of Apps in order of appearance in the RSS Feed
		'''
		apps = []
		root = ElementTree.fromstring(xml_data)
		for child in root.findall('{http://www.w3.org/2005/Atom}entry'):
			# Multiple find statements are inefficient, but the dataset is small
			d = dict(
				# App Identifiers
				name = child.find('{http://itunes.apple.com/rss}name').text,
				bundleid= child.find('{http://www.w3.org/2005/Atom}id').get('{http://itunes.apple.com/rss}bundleId'),
				id= child.find('{http://www.w3.org/2005/Atom}id').get('{http://itunes.apple.com/rss}id'),

				# App Icons
				image53 = child.find('./{http://itunes.apple.com/rss}image[@height="53"]').text,
				image75 = child.find('./{http://itunes.apple.com/rss}image[@height="75"]').text,
				image100 = child.find('./{http://itunes.apple.com/rss}image[@height="100"]').text,

				# Cost, 0 if free
				price = child.find('{http://itunes.apple.com/rss}price').get('amount'),
				currency = child.find('{http://itunes.apple.com/rss}price').get('currency'),

				# App Meta
				category = child.find('{http://www.w3.org/2005/Atom}category').get('term'),
				summary = child.find('{http://www.w3.org/2005/Atom}summary').text,
				# Develeper
				artist = child.find('{http://itunes.apple.com/rss}artist').text,
				# HTTP link in App Store
				link = child.find('{http://www.w3.org/2005/Atom}link').get('href'),

				# Dates in GMT, ISO Format
				updated = child.find('{http://www.w3.org/2005/Atom}updated').text,
				released = child.find('{http://itunes.apple.com/rss}releaseDate').text
				)
			apps.append(d)

		return apps

class AppInfoPopulate(object):
	'''
	App Info Query and Database Storage Helper
	'''

	@classmethod
	def app_store_search(cls, update=True, **parameters):
		'''
		Run the Search Query on the Apple App Store
		and thereafter populate the database
		'''
		apps = iTunesAppStoreRSSAndSearch.search(**parameters)
		if apps:
			apps = json.loads(apps)
		else:
			return []

		for app in apps.get('results', []):
			entity = AppInfo(
				name=app.get('trackName'),
				bundleid=app.get('bundleId'),
				icon=None,
				icon_url=app.get('artworkUrl60'),
				description=app.get('description'),
				version=None,
				developer=app.get('artistName'),
				company_name=app.get('artistName'),
				app_url=app.get('trackViewUrl'),
				platform=DeviceType.IOS
			)
			if update: AppInfo.update(entity)

		return apps.get('results', [])

	@classmethod
	def app_store_fetch(cls, **parameters):
		'''
		Run the Fetch Query on the Apple App Store
		and thereafter populate the database
		'''
		data = iTunesAppStoreRSSAndSearch.fetch(**parameters)
		if data:
			apps = iTunesAppStoreRSSAndSearch.parse_xml(data)
		else:
			apps = []
		for app in apps:
			entity = AppInfo(
				name=app.get('name'),
				bundleid=app.get('bundleid'),
				icon=None,
				icon_url=app.get('image53'),
				description=app.get('summary'),
				version=None,
				developer=app.get('artist'),
				company_name=app.get('artist'),
				app_url=app.get('link'),
				platform=DeviceType.IOS
			)
			AppInfo.update(entity)

		logging.getLogger().debug("Inserted %s successfully", len(apps))
		return apps


	@classmethod
	def play_store_search(cls, update=True, **parameters):
		'''
		Run the Search Query on the Google Play Store
		and thereafter populate the database
		'''
		data = GooglePlayStoreScraper.search(**parameters)
		return cls._process_store_data(data, update=update)

	@classmethod
	def play_store_fetch(cls, **parameters):
		'''
		Run the Fetch Query on the Google Play Store
		and thereafter populate the database
		'''
		data = GooglePlayStoreScraper.fetch(**parameters)
		return cls._process_store_data(data)

	@classmethod
	def _process_store_data(cls, data, update=True):
		'''
		Internal, parse the Query data
		and populate the database, for Play Store only
		'''
		parser = GooglePlayStoreScraper()

		if data:
			parser.feed(data.decode('utf-8'))
			apps = parser.apps
		else:
			apps = []

		for app in apps:
			entity = AppInfo(
				name=app.get('name'),
				bundleid=app.get('docid'),
				icon=None,
				icon_url=app.get('image-small'),
				description=app.get('description'),
				version=None,
				developer=app.get('developer'),
				company_name=app.get('developer'),
				app_url=app.get('link'),
				platform=DeviceType.ANDROID
			)
			if update: AppInfo.update(entity)

		logging.getLogger().debug("Inserted %s successfully", len(apps))
		return apps

class AppInfoScan(object):

	@classmethod
	def scan_for_unknown_apps(cls, platforms=[StoreTypeEnum.PLAY_STORE, StoreTypeEnum.APP_STORE], auto_update=True):
		apps = AppInfo.get_unknown()
		all_apps = []
		for app in apps:

			if StoreTypeEnum.PLAY_STORE in platforms:
				# Search the Play Store, this update any matched items in the database
				play_store_apps = AppInfoPopulate.play_store_search(term=app.name, update=auto_update)
				# Only if the first app is an exact match
				if len(play_store_apps) > 0:
					first_app = play_store_apps[0]
					if first_app.get('name') == app.name:
						# we have a match
						# Nothing to do this has already probably merged
						pass
					all_apps += play_store_apps

			if StoreTypeEnum.APP_STORE in platforms:
				# Search the App Store
				# This will update any matched items in the database
				app_store_apps = AppInfoPopulate.app_store_search(term=app.name, update=auto_update)
				print app_store_apps
				if len(app_store_apps) > 0:
					first_app = app_store_apps[0]
					if first_app.get('name') == app.name:
						# we have a match
						# Nothing to do this has already probably merged
						pass
					all_apps += app_store_apps

		return all_apps