import { Config } from '../Config/Config';
import { Schema } from './Schema';
import { VersionNumber } from './VersionNumber';

/**
 * This class is responsible for implementing a Version of a collection.
 */
export class Version {
    private config: Config;
    private collection: string;
    private versionNumber: VersionNumber;
    private dropIndexes?: string[] = [];
    private aggregations?: object[][] = [];
    private addIndexes?: object[] = [];
    private testData?: string;
    private theSchema: any;

    constructor(config: Config, collection: string, theVersion: any) {
        this.config = config;
        this.collection = collection;
        this.versionNumber = new VersionNumber(theVersion.version);
        Object.assign(this, theVersion);

        const schemaProcessor = new Schema(config, this.collection, this.versionNumber);
        this.theSchema = schemaProcessor.getSchema();
    }

    // Generic getter for testing
    public getThis(): any {
        return this;
    }

    public async apply(): Promise<void> {
        this.config.clearSchemaValidation(this.collection);

        // Drop indexes
        if (this.dropIndexes) {
            this.config.dropIndexes(this.collection, this.dropIndexes);
        }

        // Execute Aggregations
        if (this.aggregations) {
            this.config.executeAggregations(this.collection, this.aggregations);
        }

        // Add Indexes
        if (this.addIndexes) {
            this.config.addIndexes(this.collection, this.addIndexes);
        }

        this.config.applySchemaValidation(this.collection, this.theSchema);

        // Load Test Data
        if (this.config.shouldLoadTestData() && (this.testData)) {
            this.config.bulkLoad(
                this.collection, 
                this.config.getTestData(this.testData)
            );
        }

        this.config.setVersion(this.collection, this.versionNumber.getVersionString())
    }

    public getVersion(): VersionNumber {
        return this.versionNumber;
    }
}