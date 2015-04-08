#!/bin/bash
base=`basename $0`
rootdir=`dirname $0`
docsdir=$rootdir/docs
htmldir=$rootdir/site
usage=`cat <<HERE
build static html developer docs and optionally deploy them to google cloud storage
\nusage: $base
\n\t[--deploy]\tdeploy the built html to gcs
HERE
`

while [ "$#" -gt "0" ]
do
	case $1 in
	--deploy)     DEPLOY="true";
				  shift;;
	*) echo "Invalid parameter"; echo $usage; exit 1;;
	esac
done

(cd $rootdir && mkdocs build --clean)
if [ -n "$DEPLOY" ]; then
	(cd $rootdir && gsutil -m rsync -d -r site/ gs://docs.usersource.io)
	gsutil web set -m index.html gs://docs.usersource.io # we can add error page using -e 404.html or similar
	gsutil -m acl set -R -a public-read gs://docs.usersource.io
fi