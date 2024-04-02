import { Config } from "../config/config";
import { Version } from "./version"; // Now importing Version from a separate module
import { readFileSync } from "fs";
import { join } from "path";

export class Collection {
    private config: Config;
    private collectionName: string;
    private versions: Version[] = [];
    private currentVersion: string;

    constructor(theConfig: Config, configFile: string) {
        this.config = theConfig;
        const filePath = join(this.config.getConfigFolder(), configFile);
        const configFileContents = readFileSync(filePath, 'utf8');
        const configData = JSON.parse(configFileContents);

        this.collectionName = configData.name;
        this.versions = configData.versions;
        this.currentVersion = this.getVersion();
    }

    public async processVersions(): void {
        const db = this.config.getDatabase();
        const collection = db.collection(this.collectionName);
        
        for (const version of this.versions) {
            if (version.getVersion() > this.currentVersion) {
                await version.apply(config.getDatabase());
                this.currentVersion = this.getVersion(); 
            }
        }
    }

    public getVersion(): string {
        const db = this.config.getDatabase();
        const versionDocument = db.collection(this.collectionName).findOne({ name: "VERSION" });
        return versionDocument ? versionDocument.version : "0.0.0";
    }
}
