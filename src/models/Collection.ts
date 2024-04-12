import { Config } from "../config/Config";
import { Version } from "./Version"; 

interface CollectionConfig {
    collectionName: string;
    versions: any[];
}

/**
 * This class processes a collection configuration file. 
 */
export class Collection {
    private config: Config;
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
    constructor(theConfig: Config, collectionConfig: CollectionConfig) {
        this.config = theConfig;
        this.collectionName = collectionConfig.collectionName;
        collectionConfig.versions.forEach(version => {
            this.versions.push(new Version(this.config, this.collectionName, version));
        });
    }

    /**
     * Processing the array of versions found in a collection configuration file
     * is the core of how msm works.
     */
    public async processVersions() {
        this.currentVersion = await this.config.getVersion(this.collectionName);
        for (const version of this.versions) {
            if (version.getVersion().isGreaterThan(this.currentVersion)) {
                version.apply();
                this.currentVersion = await this.config.getVersion(this.collectionName);
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
