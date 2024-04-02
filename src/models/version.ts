import { MongoClient, Db } from 'mongodb';
import { Config } from '../config/config';
import { Schema } from './schema';

export class Version {
    private config: Config;
    private collection: string;
    private version: string = "";
    private dropIndexes: string[] = [];
    private aggregations: object[] = [];
    private addIndexes: object[] = [];

    constructor(config: Config, collection: string, versionData: string) {
        this.config = config;
        this.collection = collection;
        const data = JSON.parse(versionData);
        this.version = data.version;
        this.dropIndexes = data.dropIndexes;
        this.aggregations = data.aggregations;
        this.addIndexes = data.addIndexes;
    }

    public getVersion(): string {
        return this.version;
    }
    
    public async apply(db: Db): Promise<void> {
        const collection = db.collection(this.collection);

        // Drop schema validation (assuming MongoDB command)

        // Drop indexes
        for (const indexName of this.dropIndexes) {
            await collection.dropIndex(indexName);
        }

        // Execute Aggregations
        for (const aggregation of this.aggregations) {
            await collection.aggregate(aggregation).toArray(); // Simplified example
        }

        // Add Indexes
        for (const index of this.addIndexes) {
            await collection.createIndex(index.keys, index.options);
        }

        // Integrate Schema for validation or updates
        const schemaFilePath = this.config.getConfigFolder() + `/schemas/${this.collection}_${this.version}.json`;
        const schema = new Schema(schemaFilePath);
        const processedSchema = schema.getSchema();

        // Update VERSION document
        await collection.updateOne({ name: 'VERSION' }, { $set: { version: this.version } }, { upsert: true });
    }
}