# Main Process Psuedo Code

import config, collection 

config = new Config()

try {
    config.connect();
    for each collection yaml in config.getCollectionFolder() {
        versionIndex = 0
        while collection.getVersion() > collection.versions[versionIndex].version {versionIndex++}
        for remaining version in collection.versions {
            collection.configure(version)
        }
    }
catch(e) {
    log e
}
finally {
    config.disconnect()
}
