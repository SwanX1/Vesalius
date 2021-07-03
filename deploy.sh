#!/bin/bash

if [[ `whoami` == root ]]; then
  echo "Script is being run under root. Exiting..."
  exit 1
fi

prerequisites_met=true

if ! command -v node &> /dev/null; then
  echo "NodeJS is not installed!"
  prerequisites_met=false
fi

if ! command -v yarn &> /dev/null; then
  echo "Yarn is not installed!"
  
  if $prerequisites_met && command -v npm &> /dev/null; then
    echo "Installing Yarn through NPM..."
    echo "$ npm install --global yarn"
    npm install --global yarn &> /dev/null
  else
    prerequisites_met=false
  fi
fi

if ! $prerequisites_met; then exit 1; fi

echo "$ yarn install"
if ! yarn --silent install; then exit 1; fi
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
