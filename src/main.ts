# Main Process Psuedo Code

import config, collection 

config = new Config() // Dependency injection object

try {
    config.connect();
    for each collection yaml in config.getCollectionFolder() {
        log processing collection
        for each version in collection {
            log processing version
            if collection.getVersionFromDb() < version.version {
                collection.process(version)
            }
        }
    }
catch(e) {
    log e
}
finally {
    config.disconnect()
}
