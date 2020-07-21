#!/bin/bash

set -eu

VERSION=$(jq -r .version package.json)
echo "$VERSION"

# Publish package to npm
npm publish

#Create and publish executables.
# You need pkg@4.3.8. 4.4.0 produces a bad file for windows.
mkdir -p dist/"$VERSION"
pkg -t node10-linux-x64 package.json --output dist/"$VERSION"/linux/diffjam
pkg -t node10-win-x64 package.json --output dist/"$VERSION"/windows/diffjam.exe
pkg -t node10-macos-x64 package.json --output dist/"$VERSION"/osx/diffjam

cd  dist/"$VERSION"/linux
tar czvf diffjam-"$VERSION".tgz ./diffjam
cd ../osx
tar czvf diffjam-"$VERSION".tgz ./diffjam
cd ../../..

#PUBLISH TO S3
aws s3 sync dist/ s3://diffjam --profile=diffjam

aws s3api put-object-acl --bucket diffjam --key "$VERSION"/linux/diffjam --acl public-read --profile=diffjam
aws s3api put-object-acl --bucket diffjam --key "$VERSION"/linux/diffjam-"$VERSION".tgz --acl public-read --profile=diffjam
aws s3api put-object-acl --bucket diffjam --key "$VERSION"/windows/diffjam.exe --acl public-read --profile=diffjam
aws s3api put-object-acl --bucket diffjam --key "$VERSION"/osx/diffjam --acl public-read --profile=diffjam
aws s3api put-object-acl --bucket diffjam --key "$VERSION"/osx/diffjam-"$VERSION".tgz --acl public-read --profile=diffjam
