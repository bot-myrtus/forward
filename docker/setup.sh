#!/usr/bin/env sh
set -eu
apk add unzip curl jq
# "linux/amd64" -> "amd64"
ARCH=${TARGETPLATFORM:6}
# LINK="https://github.com/$REPO/releases/download/$TAG/$NAME-$TAG-linux-"
LINK=$LINK$ARCH-node16.zip
echo $LINK && curl -L -o bundle.zip $LINK
unzip bundle.zip -d /koishi
sed -i 's/host: .*/host: 0.0.0.0/g' /koishi/koishi.yml
