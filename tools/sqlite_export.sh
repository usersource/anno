#!/bin/bash
#
# author: topcircler
# date: 2013/6/24
#
# This script is to dump android sqlite database under current directory.
# usage: sqlite_export.sh [package_name] [database_name]
# example: sqlite_export.sh co.usersource.doui.annoplugin anno.db
#
# NOTICE: I can't execute this script correctly using git bash under Windows,
# it expands /sdcard/$2 to a windows absolute path. I believe this is a environment problem.
# This script should be able to run on Unix-like system.
#
# TODO:
# 1. add one more parameter [target_directory], ie where sqlite database is dumped to.
# 2. adb_path is not flexible.
# 3. delete /sdcard/database.db on sdcard.


if [ $# -ne 2 ]; then
  echo "sqlite_export.sh [package_name] [database_name]"
  exit 1
fi

#adb_path="/d/software/android-sdks/platform-tools/adb.exe"
adb_path="/home/leo/bin/android-sdk-linux/platform-tools/adb"

command_cat_db="$adb_path -d shell 'run-as $1 cat /data/data/$1/databases/$2 > /sdcard/$2'"
command_pull_db="$adb_path pull /sdcard/$2 ./"
echo $command_cat_db
eval $command_cat_db

echo $command_pull_db
eval $command_pull_db

exit 0
