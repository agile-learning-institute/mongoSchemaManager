import { Config } from "../config/config";
import { Version } from "./version"; // Now importing Version from a separate module

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
        this.currentVersion = await this.getVersion();
        for (const version of this.versions) {
            if (version.getVersion() > this.currentVersion) {
                version.apply();
                this.currentVersion = await this.getVersion();
            }
        }
    }

    public async getVersion(): Promise<string> {
        const versionDocument = await this.config.getCollection(this.collectionName).findOne({ name: "VERSION" });
        return versionDocument ? versionDocument.version : "0.0.0";
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
