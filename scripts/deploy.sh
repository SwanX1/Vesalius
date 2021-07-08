#!/bin/bash

echo "Removing old build files..."
rm -r dist
echo "$ yarn build"
if ! yarn --silent build; then exit 1; fi


if [ -f deploy.pid ]; then
  echo "Killing old process..."
  kill -12 `cat deploy.pid` &> /dev/null
  rm deploy.pid
fi

echo "$ node ."
node . &> /dev/null &
echo $! > deploy.pid
