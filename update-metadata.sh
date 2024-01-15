git -C /Users/ridel1e/Projects/cardano-token-handler/sources/cardano-token-registry/  pull origin master
git -C /Users/ridel1e/Projects/cardano-token-handler/sources/cardano-tokens/  pull origin master
rm -rf /Users/ridel1e/Projects/cardano-token-handler/out/logos/*
node /Users/ridel1e/Projects/cardano-token-handler/index.js
cp -r /Users/ridel1e/Projects/cardano-token-handler/out/logos/ /Users/ridel1e/Projects/cardano-token-handler/out/server/logos/
cp /Users/ridel1e/Projects/cardano-token-handler/out/cardano-token-list.json /Users/ridel1e/Projects/cardano-token-handler/out/server/

