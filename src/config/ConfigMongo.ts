import { VersionNumber } from '../models/VersionNumber';
import { Index } from '../models/Index';
import { MongoClient, Db } from 'mongodb';
import { EJSON } from 'bson';
import { Config } from './Config';

/**
 * Class ConfigMongo: This class implementes all mongodb i-o.
 */
export class ConfigMongo {
    private config: Config;
    private client?: MongoClient;
    private db?: Db;
    private msmVersionCollection = "msmCurrentVersions";
    private msmEnumeratorsCollection = "msmEnumerations";

    /**
     * Constructor gets configuration values, loads the enumerators, and logs completion
     */
    constructor(config: Config) {
        this.config = config;
    }

     /**
     * Connect to the Mongo Database
     */
    public async connect(): Promise<void> {
        const connectionString = this.config.getConnectionString();
        const dbName = this.config.getDbName();

        this.client = new MongoClient(connectionString);
        await this.client.connect();
        this.db = this.client.db(dbName);

        console.info("Database", dbName, "Connected");
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
     * Get the system collection CurrentVersions documents
     * 
     * @returns CurrentVersions array
     */
    public async getVersionData(): Promise<any> {
        let collection = await this.getCollection(this.msmVersionCollection);
        let versions = await collection.find().toArray();
        return versions;
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
}
