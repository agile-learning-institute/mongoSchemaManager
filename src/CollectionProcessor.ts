import { Config } from "./config/Config";
import { Collection } from "./models/Collection";

export class CollectionProcessor {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  public async processCollections() {
    console.info("Starting configuration and collection processing...");

    try {
      await this.config.connect();
      const collectionFiles = this.config.getCollectionFiles();

      for (const fileName of collectionFiles) {
        console.info("Processing", fileName);
        const collectionData = this.config.getCollectionConfig(fileName);
        const theCollection = new Collection(this.config, collectionData);
        await theCollection.processVersions();
      }
    } catch (e) {
      console.error(e);
      await this.config.disconnect();
      process.exit(1);
    } finally {
      await this.config.disconnect();
      console.log("Processing completed.");
    }
  }
}

// Usage
(async () => {
  const config = new Config();
  const processor = new CollectionProcessor(config);
  await processor.processCollections();
  config.disconnect();
})();
