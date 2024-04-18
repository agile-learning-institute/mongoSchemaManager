import { VersionNumber } from '../models/VersionNumber';
import { Index } from '../models/Index';
import { MongoClient, Db } from 'mongodb';
import { writeFileSync, readdirSync, mkdirSync, existsSync, copyFileSync, readFileSync, statSync } from "fs";
import { join } from 'path';
import { EJSON } from 'bson';
import * as yaml from 'js-yaml';

/**
 * A config item, used to track where configuration values were found
 */
interface ConfigItem {
    name: string;
    value: string;
    from: string;
}

/**
 * Class Config: This class manages configuration values 
 *      from the enviornment or configuration files, 
 *      and abstracts all file and mongodb i-o.
 */
export class Config {
    private configItems: ConfigItem[] = [];
    private connectionString: string;
    private dbName: string;
    private client?: MongoClient;
    private db?: Db;
    private configFolder: string = "";  // where configuration values are found
    private msmRootFolder: string;      // Where system resources (/apps & /msmTypes) are found 
    private loadTestData: boolean;      // Load test data flag
    private enumerators: any;           // System enumerators
    private msmVersionCollection = "msmCurrentVersions";
    private msmEnumeratorsCollection = "msmEnumerations";

    /**
     * Constructor gets configuration values, loads the enumerators, and logs completion
     */
    constructor() {
        this.getConfigValue("BUILT_AT", "LOCAL", false);
        this.configFolder = this.getConfigValue("CONFIG_FOLDER", "/opt/mongoSchemaManager/configurations", false);
        this.msmRootFolder = this.getConfigValue("MSM_ROOT", "/opt/mongoSchemaManager", false);
        this.connectionString = this.getConfigValue("CONNECTION_STRING", "mongodb://root:example@localhost:27017", true);
        this.dbName = this.getConfigValue("DB_NAME", "test", false);
        this.loadTestData = this.getConfigValue("LOAD_TEST_DATA", "false", false) === "true";

        console.info("Configuration Initilized:", JSON.stringify(this.configItems));
    }

    /********************************************************************************
     ***** MongoDB IO handlers                                                  *****
     ********************************************************************************/

     /**
     * Connect to the Mongo Database
     */
    public async connect(): Promise<void> {
        this.client = new MongoClient(this.connectionString);
        await this.client.connect();
        this.db = this.client.db(this.dbName);

        console.info("Database", this.dbName, "Connected");
    }

    /**
     * Simple getter for database object
     */
    public getDatabase(): Db {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        return this.db;
    }

    /**
     * Get a collection object, if the collection does not exist create it
     */
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

    /**
     * Drop a collection - only used in jest testing 
     */
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

    /**
     * Set a Version by upserting the Version document
     */
    public async setVersion(collectionName: string, versionString: string) {
        if (!this.db) {
            throw new Error("config.setVersion - Database not connected");
        }

        const filter = { "collectionName": collectionName };
        const update = { "$set": { "currentVersion": versionString } };
        const options = { "upsert": true };
        try {
            const collection = await this.getCollection(this.msmVersionCollection);
            await collection.updateOne(filter, update, options);
            console.info("Version set or updated for collection", collectionName, "to", versionString);
        } catch (error) {
            console.error("Version set failed", collectionName, versionString, "Error:", error);
            throw error;
        }
    }

    /**
     * Get the version number from the collection Version document
     * 
     * @param collectionName 
     * @returns Version String
     */
    public async getVersion(collectionName: string): Promise<string> {
        if (!this.db) {
            throw new Error("config.getVersion - Database not connected");
        }
        const collection = await this.getCollection(this.msmVersionCollection);
        const versionDocument = await collection.findOne({ collectionName: collectionName });
        return versionDocument ? versionDocument.currentVersion : "0.0.0.0";
    }

    /**
     * Add the provided schema validation to the identified collection
     * 
     * @param collectionName 
     * @param schema 
     */
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
            console.info("Schema validation applied successfully:", collectionName, JSON.stringify(result));
        } catch (error) {
            console.error("Failed to apply schema validation:", collectionName, error, JSON.stringify(schema));
            throw error;
        }
    }

    /**
     * Get the current schema validation - Used by jest testing
     * 
     * @param collectionName 
     * @returns schema
     */
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

        return validationRules;
    }

    /**
     * Clear (remove) the current schema validation from the specified collection
     * 
     * @param collectionName 
     */
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

    /**
     * Create the specified indexes on the identified collection
     * 
     * @param collectionName 
     * @param indexes 
     */
    public async addIndexes(collectionName: string, indexes: any[]) {
        if (!this.db) {
            throw new Error("Database not connected");
        }

        // If no indexes are provided don't try to add them.
        if (indexes.length < 1) {
            return;
        }

        // Create the Indexes
        try {
            const collection = await this.getCollection(collectionName);
            const result = await collection.createIndexes(indexes);
            console.info("Indexes added successfully:", JSON.stringify(result));
        } catch (error) {
            console.error("Failed to add indexes:", collectionName, indexes, error);
            throw error;
        }

    }

    /**
     * get Indexes - used by jest testing
     * 
     * @param collectionName 
     * @returns indexes
     */
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

    /**
     * Drop the named indexes from the specified collection
     * 
     * @param collectionName 
     * @param names (index names)
     */
    public async dropIndexes(collectionName: string, names: string[]) {
        if (!this.db) {
            throw new Error("Database not connected");
        }

        // if no names are provided, don't try to drop
        if (names.length < 1) {
            return;
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

    /**
     * Execut the provided aggregation pipelines on the identified collection
     * 
     * @param collectionName 
     * @param aggregations - array of aggregation pipelines
     */
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

    /**
     * bulk laod the provided data to the specified collection
     * 
     * @param collectionName 
     * @param data 
     */
    public async bulkLoad(collectionName: string, data: any[]) {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        
        try {
            const collection = await this.getCollection(collectionName);
            const result = await collection.insertMany(EJSON.deserialize(data));
            console.info("Bulk load successfully loaded", result.insertedCount, "documents");
        } catch (error) {
            console.error("Failed to perform bulk load:", error);
            throw error; 
        }
    }

    /**
     * Load the Enumerators Collection into the MongoDB
     */
    public async loadEnumerators() {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        
        await this.bulkLoad(this.msmEnumeratorsCollection, this.enumerators);
    }

    /**
     * Disconnect from the database
     */
    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = undefined;
            this.db = undefined;
        }
    }

    /********************************************************************************
     ***** Filesystem IO handlers                                               *****
     ********************************************************************************/

    /**
     * Initilize file system access, validate config folders exist.
     */
    public attachFiles() {
        this.checkFolders();
        this.enumerators = this.readEnumeratorsFile();
    }

    /**
     * Get the named configuration value, from the environment if available, 
     * then from a file if present, and finally use the provided default if not 
     * found. This will add a ConfigItem that describes where this data was found
     * to the configItems array. Secret values are not recorded in the configItem.
     * 
     * @param name 
     * @param defaultValue 
     * @param isSecret 
     * @returns the value that was found.
     */
    private getConfigValue(name: string, defaultValue: string, isSecret: boolean): string {
        let value = process.env[name] || defaultValue;
        let from = 'default';

        if (process.env[name]) {
            from = 'environment';
        } else {
            const filePath = join(this.configFolder, name);
            if (existsSync(filePath)) {
                value = readFileSync(filePath, 'utf-8').trim();
                from = 'file';
            }
        }

        this.configItems.push({ name, value, from });
        return value;
    }

    /**
    * Check to make sure configuration folders exist, creating folders that are mssing, or throwing
    * an error if missing folders can not be empty.
    */
    private checkFolders() {
        this.assertFolderExists(this.msmRootFolder, false);
        this.assertFolderExists(this.getCollectionsFolder(), false);
        this.assertFolderExists(this.getMsmEnumeratorsFolder(), false);
        this.assertFolderExists(this.getSchemasFolder(), false);

        this.assertFolderExists(this.getMsmTypesFolder(), true);
        this.assertFolderExists(this.getOpenApiFolder(), true);
        this.assertFolderExists(this.getTestDataFolder(), true);


        if (!existsSync(this.getMsmEnumeratorsFile())) {
            throw new Error("Enumerations File does not exist! " + this.getMsmEnumeratorsFile());
        }
    }

    private assertFolderExists(folderName: string, createIt: boolean) {
        if (!(existsSync(folderName) && statSync(folderName).isDirectory())) {
            if (createIt) {
                mkdirSync(folderName);
                console.info(folderName, "Created");
            } else {
                throw new Error("Folder does not exist! " + folderName);
            }
        }
    }

    /**
     * Read the Enumerations
     * @returns JSON parsed Enumerators
     */
    public readEnumeratorsFile(): any {
        let enumeratorsFileName = this.getMsmEnumeratorsFile();
        return JSON.parse(readFileSync(enumeratorsFileName, 'utf-8'));
    }
    
    /**
     * Configure the swagger viewer app
     * - Copy this.msmRootFolder + /app to this.getOpenApiFolder
     * - Write all documents from msmVersions folder to versions.json
     */
    public async configureApp() {
        const appFile = join(this.msmRootFolder, "app", "index.html");
        const targetFile = join(this.getOpenApiFolder(), "index.html");
        copyFileSync(appFile, targetFile);
        
        const versionsFile = join(this.getOpenApiFolder(), "versions.json");
        let collection = await this.getCollection(this.msmVersionCollection);
        let versions = await collection.find().toArray();
        writeFileSync(versionsFile, JSON.stringify(versions), 'utf8');
    }

    /**
     * Get the collection configuration files from the collections folder
     * 
     * @returns array of file names
     */
    public getCollectionFiles(): string[] {
        const collectionsFolder = this.getCollectionsFolder();
        const collectionFiles = readdirSync(collectionsFolder).filter(file => file.endsWith('.json'));
        if (!Array.isArray(collectionFiles)) {
            return [];
        }
        return collectionFiles;
    }

    /**
     * Read the specified collection configuration file 
     * 
     * @param fileName 
     * @returns JSON Collection object
     */
    public getCollectionConfig(fileName: string): any {
        const filePath = join(this.configFolder, "collections", fileName);
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    }

    /**
     * Get a custom type, looking first in the msmTypesFolder and if not
     * found there look in the <root>/customTypes folder.
     * 
     * @param type - the name of the type file (without a json extension)
     * @returns The parsed JSON object from the type file
     */
    public getType(type: string): any {
        let typeFilename: string;
        typeFilename = join(this.getMsmTypesFolder(), type + ".json");
        if (!existsSync(typeFilename)) {
            typeFilename = join(this.configFolder, "customTypes", type + ".json")
            if (!existsSync(typeFilename)) {
                throw new Error("Type Not Found:" + type);
            }
        }
        const typeContent = readFileSync(typeFilename, 'utf-8');
        return JSON.parse(typeContent);
    }

    /**
     * Read the collection schema file specified at the version provided
     * 
     * @param collection 
     * @param version 
     * @returns a schema object (NOT pre-processed)
     */
    public getSchema(collection: string, version: VersionNumber): any {
        const schemaFileName = join(this.getSchemasFolder(), collection + "-" + version.getShortVersionString() + ".json");
        return JSON.parse(readFileSync(schemaFileName, 'utf8'));
    }

    /**
     * Save swagger
     * 
     * @param collection 
     * @param version 
     * @returns a schema object (NOT pre-processed)
     */
    public saveSwagger(collection: string, version: VersionNumber, swagger: any) {
        const swaggerFilename = join(this.getOpenApiFolder(), collection + "-" + version.getVersionString() + ".openapi.yaml");
        writeFileSync(swaggerFilename, yaml.dump(swagger), 'utf8');
    }

    /**
     * Read the test data file specified
     * 
     * @param filename 
     * @returns JSON parsed object from the file
     */
    public getTestData(filename: string): any {
        let filePath = join(this.getTestDataFolder(), filename + ".json");
        return JSON.parse(readFileSync(filePath, 'utf8'));
    }
    
    /********************************************************************************
     ***** Normal Object getters                                                *****
     ********************************************************************************/

    /**
     * Get the named enumerators object from the enumerators version specified
     * 
     * @param version 
     * @param name 
     * @returns enumerators object {"Value":"Description"}
     */
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

    public shouldLoadTestData(): boolean {
        return this.loadTestData;
    }

    public getConfigItems(): ConfigItem[] {
        return this.configItems;
    }

    public getConfigFolder(): string {
        return this.configFolder;
    }

    public getCollectionsFolder() {
        return join(this.configFolder, "collections");
    }    

    public getMsmTypesFolder(): string {
        return join(this.msmRootFolder, "msmTypes");
    }

    public getMsmEnumeratorsFolder(): string {
        return join(this.configFolder, "enumerators");
    }

    public getMsmEnumeratorsFile(): string {
        return join(this.getMsmEnumeratorsFolder(), "enumerators.json");
    }

    public getOpenApiFolder(): string {
        return join(this.configFolder, "openApi");
    }    

    public getSchemasFolder(): string {
        return join(this.configFolder, "schemas")
    }

    public getTestDataFolder(): string {
        return join(this.configFolder, "testData");
    }
}
