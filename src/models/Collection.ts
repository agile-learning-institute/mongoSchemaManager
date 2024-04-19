import { Config } from "../config/Config";
import { FileIO } from "../config/FileIO";
import { MongoIO } from "../config/MongoIO";
import { Version } from "./Version"; 

interface CollectionConfig {
    name: string;
    versions: any[];
}

/**
 * This class processes a collection configuration file. 
 */
export class Collection {
    private config: Config;
    private mongoIO: MongoIO;
    private fileIO: FileIO;
    private collectionName: string;
    private versions: Version[] = [];
    private currentVersion: string = "";

    /**
     * Constructor gets a dependency injection of the config object, 
     * and a parsed collection config file. See /docs/config-schema.json.
     * Construction constructs Version documents before processing.
     * 
     * @param theConfig 
     * @param collectionConfig 
     */
    constructor(config: Config, mongoIO: MongoIO, fileIO: FileIO, collectionConfig: CollectionConfig) {
        this.config = config;
        this.mongoIO = mongoIO;
        this.fileIO = fileIO;
        this.collectionName = collectionConfig.name;
        collectionConfig.versions.forEach(version => {
            console.info("Initilizing Version", this.collectionName, version.version)
            this.versions.push(new Version(this.config, mongoIO, fileIO, this.collectionName, version));
        });
    }

    /**
     * Processing the array of versions found in a collection configuration file
     * is the core of how msm works.
     */
    public async processVersions() {
        this.currentVersion = await this.mongoIO.getVersion(this.collectionName);
        for (const version of this.versions) {
            if (version.getVersion().isGreaterThan(this.currentVersion)) {
                await version.apply();
                this.currentVersion = await this.mongoIO.getVersion(this.collectionName);
            }
        }
    }

    /**
     * Simple Getters
     */
    public getCurrentVersion(): string {
        return this.currentVersion;
    }
    
    public getName(): string {
        return this.collectionName;
    }

    public getVersions(): Version[] {
        return this.versions;
    }
}
