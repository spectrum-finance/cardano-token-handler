#!/bin/bash

INITIAL_PATH=/Users/ridel1e/Projects/cardano-token-handler/

git -C "$INITIAL_PATH/sources/cardano-token-registry/"  pull origin master
git -C "$INITIAL_PATH/sources/cardano-tokens/"  pull origin master
rm -rf "$INITIAL_PATH/out/logos/*"
node "$INITIAL_PATH/index.js"
cp -a "$INITIAL_PATH/out/logos/." /Users/ridel1e/Projects/cardano-token-handler/out/server/logos/
cp "$INITIAL_PATH/out/cardano-token-list.json" /Users/ridel1e/Projects/cardano-token-handler/out/server/

