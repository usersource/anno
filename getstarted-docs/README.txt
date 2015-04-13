* The getstarted-docs are written in markdown (http://daringfireball.net/projects/markdown/syntax)
* mkdocs (http://www.mkdocs.org/) is used to convert the documents to html
* source docs are in the 'docs' sub-folder
* generated html is available in the 'site' sub-folder
* the shell script makedocs.sh takes an optional argument: 
	makedocs.sh [--publish]
	# builds and (optionally) publishes the document to google cloud storage 
	# --publish build the docs and also publishes to gcs. Default is to just build the docs and store in 'site'

* to enable makedocs.sh to function you will need to install and configure gsutil
* Download gsutil: https://cloud.google.com/storage/docs/gsutil_install
* Configure: gsutil config