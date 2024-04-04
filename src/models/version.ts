import { Config } from '../config/Config';
import { Schema } from './Schema';

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
    private theSchema: any;

    constructor(config: Config, collection: string, theVersion: any) {
        this.config = config;
        this.collection = collection;
        this.version = theVersion.verison;
        Object.assign(this, theVersion);

        const schemaProcessor = new Schema(config, this.collection, this.version);
        this.theSchema = schemaProcessor.getSchema();
    }

    // Generic getter for testing
    public getThis(): any {
        return this;
    }

    public async apply(): Promise<void> {
        this.config.clearSchemaValidation(this.version);

        // Drop indexes
        if (this.dropIndexes) {
            this.config.dropIndexes(this.dropIndexes);
        }

        // Execute Aggregations
        if (this.aggregations) {
            this.config.executeAggregations(this.aggregations);
        }

        // Add Indexes
        if (this.addIndexes) {
            this.config.addIndexes(this.addIndexes);
        }

        this.config.applySchemaValidation(this.collection, this.theSchema);

        // Load Test Data
        if (this.config.shouldLoadTestData() && (this.testData)) {
            this.config.bulkLoad(this.collection, this.testData)
        }

        this.config.setVersion(this.collection, this.version)
    }

    public getVersion() {
        return this.version;
    }
}