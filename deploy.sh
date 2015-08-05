#!/bin/sh

wintersmith build

git add .

git commit -am "Build"

git push origin master
git push prod master
