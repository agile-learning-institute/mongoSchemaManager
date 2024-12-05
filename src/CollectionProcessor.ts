import { Config } from "./config/Config";
import { FileIO } from "./config/FileIO";
import { MongoIO } from "./config/MongoIO";
import { Collection } from "./models/Collection";

export class CollectionProcessor {
  private config: Config;
  private mongoIO: MongoIO;
  private fileIO: FileIO;

  constructor(config: Config, fileIO: FileIO, mongoIO: MongoIO) {
    this.config = config;
    this.mongoIO = mongoIO;
    this.fileIO = fileIO;
  }

  public async processCollections() {
    console.info("Starting configuration and collection processing...");

    try {
      await this.mongoIO.connect();
      this.fileIO.attachFiles();
      const collectionFiles = this.fileIO.getCollectionFiles();

      // Process all collection files
      for (const fileName of collectionFiles) {
        console.info("Processing", fileName);
        const collectionData = this.fileIO.getCollectionConfig(fileName);
        const theCollection = new Collection(this.config, this.mongoIO, this.fileIO, collectionData);
        await theCollection.processVersions();
      }

      // Write enumerators collection and Swagger Viewing app
      await this.mongoIO.upsertEnumerators(this.config.getMsmEnumerators());
      console.info("Enumerators Loaded:", JSON.stringify(this.config.getMsmEnumerators()));

      // Deploy the swagger viewer application
      const versions = await this.mongoIO.getVersionData();
      this.fileIO.configureApp(versions);
      console.info("App Deployed, Versions:", JSON.stringify(versions));


    } catch (e) {
      console.info(e);
      await this.mongoIO.disconnect();
      process.exit(1);
    } finally {
      await this.mongoIO.disconnect();
      console.log("Processing completed successfully!");
    }
  }
}

// Usage
(async () => {
  const config = new Config();
  const mongoIO = new MongoIO(config);
  const fileIO = new FileIO(config);
  const processor = new CollectionProcessor(config, fileIO, mongoIO);
  await processor.processCollections();
})();
