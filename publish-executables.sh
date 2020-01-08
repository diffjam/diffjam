#!/bin/bash


VERSION=`cat package.json | jq .version | sed 's/"//g'`
echo $VERSION

npm publish
mkdir -p dist/$VERSION
pkg -t node10-linux-x64 package.json --output dist/$VERSION/linux/diffjam
pkg -t node10-windows-x64 package.json --output dist/$VERSION/windows/diffjam.exe
pkg -t node10-macos-x64 package.json --output dist/$VERSION/osx/diffjam

#PUBLISH TO S3?
aws s3 sync dist/ s3://diffjam --profile=diffjam

aws s3api put-object-acl --bucket diffjam --key $version/linux/diffjam --acl public-read --profile=diffjam
aws s3api put-object-acl --bucket diffjam --key $version/windows/diffjam --acl public-read --profile=diffjam
aws s3api put-object-acl --bucket diffjam --key $version/osx/diffjam --acl public-read --profile=diffjam
