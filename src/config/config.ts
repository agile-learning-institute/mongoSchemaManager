/**
 * Class Config: This class manages configuration values 
 *      from the enviornment or configuration files, 
 *      and abstracts all file and mongodb i-o.
 */
import { VersionNumber } from '../models/VersionNumber';
import { Index } from '../models/Index';
import { MongoClient, Db } from 'mongodb';
import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from 'path';

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
            this.enumerators = { "enumerators": {} };
        }

        console.info("Configuration Initilized:", JSON.stringify(this.configItems));
    }

    public async connect(): Promise<void> {
        this.client = new MongoClient(this.connectionString);
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        console.info("Database", this.dbName, "Connected");
    }

    public getDatabase(): Db {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        return this.db;
    }

    public async getCollection(collectionName: string) {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        const collections = await this.db.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
        if (collections.length === 0) {
            // Collection does not exist, create it
            await this.db.createCollection(collectionName);
            console.info("Collection", collectionName, "created successfully.");
        }

        return this.db.collection(collectionName);
    }

    public async dropCollection(collectionName: string) {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        const success = await this.db.collection(collectionName).drop();
        if (!success) {
            console.error("Drop Collection failed")
            throw new Error("Drop Collection Failed!");
        }
        console.info("Collection", collectionName, "dropped");
    }

    public async setVersion(collectionName: string, versionString: string) {
        if (!this.db) {
            throw new Error("config.setVersion - Database not connected");
        }
        const versionDocument = { name: "VERSION", version: versionString };
        const filter = { name: "VERSION" };
        const update = { $set: versionDocument };
        const options = { upsert: true };
        const collection = await this.getCollection(collectionName);
        await collection.updateOne(filter, update, options);
        console.info("Version set or updated in collection", collectionName, "to", versionString);
    }

    public async getVersion(collectionName: string): Promise<string> {
        if (!this.db) {
            throw new Error("config.getVersion - Database not connected");
        }
        const collection = await this.getCollection(collectionName);
        const versionDocument = await collection.findOne({ name: "VERSION" });
        console.info("getVersion from collection", collectionName, "found", JSON.stringify(versionDocument));
        return versionDocument ? versionDocument.version : "0.0.0.0";
    }

    public async applySchemaValidation(collectionName: string, schema: any) {
        if (!this.db) {
            throw new Error("Database not connected");
        }

        // make sure the collection exists
        await this.getCollection(collectionName);

        const command = {
            collMod: collectionName,
            validator: { $jsonSchema: schema }
        };

        try {
            const result = await this.db.command(command);
            console.info("Schema validation applied successfully:", JSON.stringify(result));
        } catch (error) {
            console.error("Failed to apply schema validation:", error);
            throw error;
        }
    }

    public async getSchemaValidation(collectionName: string): Promise<any> {
        if (!this.db) {
            throw new Error("Database not connected");
        }

        // make sure the collection exists
        await this.getCollection(collectionName);

        const collections = await this.db.listCollections({ name: collectionName }, { nameOnly: false }).toArray();
        if (collections.length != 1) {
            throw new Error("getSchemaValidation could not find collection " + collectionName + collections);
        }
        const validationRules = collections[0].options?.validator || {};

        console.info("Get Schema Rules:", JSON.stringify(validationRules));
        return validationRules;
    }

    public async clearSchemaValidation(collectionName: string) {
        if (!this.db) {
            throw new Error("Database not connected");
        }

        // make sure the collection exists
        await this.getCollection(collectionName);

        const command = {
            collMod: collectionName,
            validator: {}
        };

        try {
            const result = await this.db.command(command);
            console.info("Schema validation cleared successfully:", JSON.stringify(result));
        } catch (error) {
            console.error("Failed to clear schema validation:", error);
            throw error;
        }
    }

    public async addIndexes(collectionName: string, indexes: any[]) {
        if (!this.db) {
            throw new Error("Database not connected");
        }

        try {
            const collection = await this.getCollection(collectionName);
            const result = await collection.createIndexes(indexes);
            console.info("Indexes added successfully:", JSON.stringify(result));
        } catch (error) {
            console.error("Failed to add indexes:", error);
            throw error;
        }
    }

    public async getIndexes(collectionName: string): Promise<Index[]> {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        try {
            const collection = await this.getCollection(collectionName);
            const indexes = await collection.indexes();
            return indexes as Index[];
        } catch (error) {
            console.error("Failed to get indexes:", error);
            throw error;
        }
    }

    public async dropIndexes(collectionName: string, names: string[]) {
        if (!this.db) {
            throw new Error("Database not connected");
        }

        try {
            const collection = await this.getCollection(collectionName);
            for (const name of names) {
                await collection.dropIndex(name);
                console.info(`Index ${name} dropped successfully from collection ${collectionName}.`);
            }
        } catch (error) {
            console.error(`Failed to drop indexes from collection ${collectionName}:`, error);
            throw error;
        }
    }

    public async executeAggregations(collectionName: string, aggregations: any[][]) {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        const collection = await this.getCollection(collectionName);
        for (const aggregation of aggregations) {
            const result = await collection.aggregate(aggregation).toArray();
            console.info("Executed:", JSON.stringify(aggregations));
            console.info( "Result:", JSON.stringify(result));
        }
    }

    public async bulkLoad(collectionName: string, data: any[]) {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        
        try {
            const collection = await this.getCollection(collectionName);
            const result = await collection.insertMany(data);
            console.info("Bulk load successful: ", JSON.stringify(result));
        } catch (error) {
            console.error("Failed to perform bulk load:", error);
            throw error; 
        }
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
        const filePath = join(this.configFolder, "collections", fileName);
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
