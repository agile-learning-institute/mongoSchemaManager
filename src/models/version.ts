import { MongoClient, Db } from 'mongodb';
import { Config } from '../config/config';
import { Schema } from './schema';

/**
 * This class is responsible for implementing a Version of a collection.
 */
export class Version {
    private config: Config;
    private collection: string;
    private version: string;
    private dropIndexes?: string[] = [];
    private aggregations?: object[] = [];
    private addIndexes?: object[] = [];
    private testData?: string;
    private schema: any;

    constructor(config: Config, collection: string, theVersion: any) {
        this.config = config;
        this.collection = collection;
        this.version = theVersion.verison;
        Object.assign(this, theVersion);

        const schemaFileName = config.getSchemasFile(this.collection, this.version);
        const schemaProcessor = new Schema(config, this.collection, this.version);
        this.schema = schemaProcessor.getSchema();
    }

    public getVersion(): string {
        return this.version;
    }
    
    public getSchema(): any {
        return this.schema;
    }
    
    public getThis(): any {
        return this;
    }

    public async apply(): Promise<void> {
        // Setup mongo collection

        // Drop schema validation

        // Drop indexes
        if (this.dropIndexes) {
            for (const indexName of this.dropIndexes) {
                // Drop Index
            }
        }

        // Execute Aggregations
        if (this.aggregations) {
            for (const aggregation of this.aggregations) {
                // Execute aggretation pipeline
            }
        }

        // Add Indexes
        if (this.addIndexes) {
            for (const index of this.addIndexes) {
                // add index
            }
        }

        // Apply Schema
        // apply ths.schema

        // Load Test Data
        if (this.config.shouldLoadTestData() && (this.testData)) {
            const dataFile = this.config.getTestDataFile(this.testData);
            // bulk load data file
        }

        // Update VERSION document
        // mongo upsert {"name": "VERSIN", "verison": version}
    }
}