#!/bin/bash
base=`basename $0`
rootdir=`dirname $0`
docsdir=$rootdir/docs
htmldir=$rootdir/site
usage=`cat <<HERE
build static html developer docs and optionally publish them to google cloud storage
\nusage: $base
\n\t[--publish]\tpublish the generated html to gcs
HERE
`

while [ "$#" -gt "0" ]
do
	case $1 in
	--publish)     publish="true";
				  shift;;
	*) echo "Invalid parameter"; echo $usage; exit 1;;
	esac
done

(cd $rootdir && mkdocs build --clean)
if [ -n "$publish" ]; then
	(cd $rootdir && gsutil -m rsync -d -r site/ gs://docs.usersource.io)
	gsutil web set -m index.html gs://docs.usersource.io # we can add error page using -e 404.html or similar
    gsutil -m acl ch -R -u AllUsers:R gs://docs.usersource.io
fi
