/**
 * Class Config: This class manages configuration values 
 *      from the enviornment or configuration files, 
 *      and abstracts all file and mongodb i-o.
 */
import { MongoClient, Db } from 'mongodb';
import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from 'path';
import { VersionNumber } from '../models/VersionNumber';

interface ConfigItem {
    name: string;
    value: string;
    from: string;
}

export class Config {
    private configItems: ConfigItem[] = []; 
    private connectionString: string;
    private dbName: string;
    private client?: MongoClient;
    private db?: Db;
    private configFolder: string = "";
    private msmTypesFolder: string;
    private loadTestData: boolean;
    private enumerators: any;

    constructor() {
        this.configFolder = this.getConfigValue("CONFIG_FOLDER", "/opt/mongoSchemaManager/config", false);
        this.msmTypesFolder = this.getConfigValue("MSM_TYPES", "/opt/mongoSchemaManager/msmTypes", false);
        this.connectionString = this.getConfigValue("CONNECTION_STRING", "mongodb://root:example@localhost:27017", true);
        this.dbName = this.getConfigValue("DB_NAME", "test", false);
        this.loadTestData = this.getConfigValue("LOAD_TEST_DATA", "false", false) === "true";

        let enumeratorsFileName = join(this.configFolder, "enumerators", "enumerators.json");
        if (existsSync(enumeratorsFileName)) {
            this.enumerators = JSON.parse(readFileSync(enumeratorsFileName, 'utf-8'));
        } else {
            this.enumerators = {"enumerators":{}};
        }

        console.log("INFO", "Configuration Initilized:", JSON.stringify(this.configItems)); 
    }

    public async connect(): Promise<void> {
        this.client = new MongoClient(this.connectionString);
        await this.client.connect();
        this.db = this.client.db(this.dbName);
    }

    public getDatabase(): Db {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        return this.db;
    }

    public getCollection(collectionName: string) {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        return this.db.collection(collectionName);
    }

    public async getVersion(collectionName: string): Promise<string> {
        const collection = this.getCollection(collectionName);
        const versionDocument = await collection.findOne({ name: "VERSION" });
        return versionDocument ? versionDocument.version : "0.0.0.0";
    }

    public async clearSchemaValidation(collection: string) {
        // TODO
    }

    public async dropIndexes(names: string[]) {
        // TODO
    }

    public async executeAggregations(aggregations: any) {
        // TODO
    }

    public async addIndexes(indexes: any[]) {
        // TODO
    }

    public async applySchemaValidation(collection: string, schema: any) {
        // TODO
    }

    public async bulkLoad(collection: string, data: any[]) {
        // TODO
    }

    public async setVersion(collection: string, versionString: string) {
        // TODO UpSert Version Doc
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = undefined;
            this.db = undefined;
        }
    }

    public getEnums(version: number, name: string): any {
        if (this.enumerators[version].version != version) {
            throw new Error("Invalid Enumerators File bad version number sequence")
        }
        if (this.enumerators[version].enumerators.hasOwnProperty(name)) {
            return this.enumerators[version].enumerators[name];
        } else {
            throw new Error("Enumerator does not exist:" + name);
        }
    }

    public getCollectionFiles(): string[] {
        const collectionsFolder = join(this.configFolder, "collections");
        const collectionFiles = readdirSync(collectionsFolder).filter(file => file.endsWith('.json'));
        if (!Array.isArray(collectionFiles)) {
            return [];
        }
        return collectionFiles;
    }

    public getCollectionConfig(fileName: string): any {
        const filePath = join(this.configFolder, "collections", fileName );
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    }

    public getType(type: string): any {
        let typeFilename: string;
        typeFilename = join(this.msmTypesFolder, type + ".json");
        if (!existsSync(typeFilename)) {
            typeFilename = join(this.configFolder, "customTypes", type + ".json") 
            if (!existsSync(typeFilename)) {
                throw new Error("Type Not Found:" + type);
            }
        }
        const typeContent = readFileSync(typeFilename, 'utf-8');
        return JSON.parse(typeContent);
    }

    public getSchema(collection: string, version: VersionNumber): any {
        const schemaFileName = join(this.configFolder, "schemas", collection + "-" + version.getShortVersionString() + ".json");
        return JSON.parse(readFileSync(schemaFileName, 'utf8'));
    }

    public getTestData(filename: string): any {
        let filePath = join(this.configFolder, "testData", filename + ".json");
        return JSON.parse(readFileSync(filePath, 'utf8'));
    }

    public getConfigFolder(): string {
        return this.configFolder;
    }

    public getMsmTypesFolder(): string {
        return this.msmTypesFolder;
    }

    public shouldLoadTestData(): boolean {
        return this.loadTestData;
    }

    private getConfigValue(name: string, defaultValue: string, isSecret: boolean): string {
        let value = process.env[name] || defaultValue;
        let from = 'default';

        if (process.env[name]) {
            from = 'environment';
        } else {
            const filePath = join(this.configFolder, name);
            if (existsSync(filePath)) {
                value = readFileSync(filePath, 'utf-8');
                from = 'file';
            }
        }

        this.configItems.push({ name, value, from });
        return value;
    }
}
