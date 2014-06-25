#!/bin/bash
base=`basename $0`
usage=`cat <<HERE
usage: $base [--sdkhome <sdk-home>] commands args...
\n\t[--sdkhome <sdk-home>]\tset the google sdk home
\n\t[--help]\tprint this message and exit
\n\t[--echo]\techo the PYTHONPATH
HERE
`
while [ "$#" -gt "0" ]; do
	case "$1" in
		--sdkhome) SDKHOME=$2; shift 2;;
		--help) echo $usage; exit 0;;
		--echo) ECHO="true"; shift;;
		*) break;;
	esac
done
if [ -z "$SDKHOME" ]; then
	read -p "Enter your Google SDK's root folder: " SDKHOME
fi

PYTHONPATH="$PYTHONPATH:$SDKHOME"
for i in $SDKHOME/lib/*; do
	PYTHONPATH="$PYTHONPATH:$i"
done
export PYTHONPATH
if [ -n "$ECHO" ]; then
	echo $PYTHONPATH
fi
$*