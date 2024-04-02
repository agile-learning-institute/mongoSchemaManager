import { Config } from "./modules/config";
import { Collection } from "./modules/collection";
import { readdirSync } from "fs";
import { join } from "path";

// Log starting
console.log("Starting configuration and collection processing...");

(async () => {
  const config = new Config(); // Runtime Configurations
  try {
    await config.connect();
    const configFolder = config.getConfigFolder();
    const collectionFiles = readdirSync(configFolder).filter(file => file.endsWith('.json'));

    for (const fileName of collectionFiles) {
      const filePath = join(configFolder, fileName);
      const theCollection = new Collection(config, filePath);
      await theCollection.processVersions();
    }
  } catch (e) {
    console.error(e);
    await config.disconnect();
    process.exit(1);
  } finally {
    await config.disconnect();
  }
  console.log("Processing completed.");
})();
