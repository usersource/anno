* The getstarted-docs are written in markdown (http://daringfireball.net/projects/markdown/syntax)
* mkdocs (http://www.mkdocs.org/) is used to convert the documents to html
* source docs are in the 'docs' sub-folder
* generated html is available in the 'site' sub-folder
* the shell script deploy.sh takes an optional argument: 
	makedocs.sh [--deploy]
	# builds and (optionally) deploys the document to google cloud storage 
	# --deploy build the docs and also deploy to gcs. Default is to just build the docs and store in 'site'

* to enable makedocs.sh to function you will need to install and configure gsutil
* Download gsutil: https://cloud.google.com/storage/docs/gsutil_install
* Configure: gsutil config