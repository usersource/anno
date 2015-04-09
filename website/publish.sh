#!/bin/bash
base=`basename $0`
rootdir=`dirname $0`
usage=`cat <<HERE
publish the static website to staging or prod server
\n\nusage: $base\t[--staging|--prod]
\n\tpublish to the staging or prod gcs bucket server
HERE
`

while [ "$#" -gt "0" ]
do
	case $1 in
	--staging)     STAGING="true";
				  shift;;
	--prod)  PROD="true"; shift;;
	*) echo "Invalid parameter"; echo $usage; exit 1;;
	esac
done

# if staging and prod were specified, we only do staging
if [ -n "$STAGING" ]; then
	target="staging.usersource.io"
else if [ -n "$PROD" ]; then
	target="www.usersource.io"
else
	echo "Specify --staging or --prod"; echo $usage; exit 1;
fi

(cd $rootdir && gsutil -m rsync -d -r html/ gs://$target)
gsutil web set -m index.html gs://$target # we can add error page using -e 404.html or similar
gsutil -m acl set -R -a public-read gs://$target
