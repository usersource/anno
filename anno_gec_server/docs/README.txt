Here's how you generate html documentation. Ideally 'make html'
should have worked but due to gae's SDK, we need to setup some paths
before sphinx will produce the documentation

	Install sphinx, then
	# sudo pip install sphinxcontrib-httpdomain

	cd docs # this directory
	./gaepath.sh --sdkhome <path-to-google-sdk-root> make html

	# thats it. point your browser to file:///..../docs/build/index.html