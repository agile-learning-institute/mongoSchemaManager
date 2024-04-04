import { Config } from "../config/Config";
import { Version } from "./Version"; 

interface CollectionConfig {
    collectionName: string;
    versions: any[];
}

/**
 * This class processes a collection configuration file
 */
export class Collection {
    private config: Config;
    private collectionName: string;
    private versions: Version[] = [];
    private currentVersion: string = "";

    constructor(theConfig: Config, collectionConfig: CollectionConfig) {
        this.config = theConfig;
        this.collectionName = collectionConfig.collectionName;
        collectionConfig.versions.forEach(version => {
            this.versions.push(new Version(this.config, this.collectionName, version));
        });
    }

    public async processVersions() {
        this.currentVersion = await this.config.getVersion(this.collectionName);
        for (const version of this.versions) {
            if (version.getVersion() > this.currentVersion) {
                version.apply();
                this.currentVersion = await this.config.getVersion(this.collectionName);
            }
        }
    }

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
