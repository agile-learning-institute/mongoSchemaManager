import { Config } from '../config/Config';
import { Schema } from './Schema';
import { VersionNumber } from './VersionNumber';

/**
 * This class is responsible for implementing a Version of a collection.
 * The apply method in this class is responsible processing a migration
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

    /**
     * The constructor initializes the instance, 
     * and retrieves the process schema needed by this version
     * 
     * @param config Dependency injection
     * @param collection The name of the collection
     * @param theVersion The version number
     */
    constructor(config: Config, collection: string, theVersion: any) {
        this.config = config;
        this.collection = collection;
        this.versionNumber = new VersionNumber(theVersion.version);
        Object.assign(this, theVersion);

        const schemaProcessor = new Schema(config, this.collection, this.versionNumber);
        this.theSchema = schemaProcessor.getSchema();
    }

    /**
     * This is where the magic happens
     */
    public async apply(): Promise<void> {
        console.info("Applying", this.collection, this.versionNumber.getVersionString());

        await this.config.clearSchemaValidation(this.collection);

        // Drop indexes
        if ((this.dropIndexes) && (this.dropIndexes.length > 0)) {
            await this.config.dropIndexes(this.collection, this.dropIndexes);
        } else {
            console.info("No indexes to drop");
        }

        // Execute Aggregations
        if ((this.aggregations) && (this.aggregations.length > 0)) {
            await this.config.executeAggregations(this.collection, this.aggregations);
        } else {
            console.info("No aggregations to execute");
        }


        // Add Indexes
        if ((this.addIndexes) && (this.addIndexes.length > 0)) {
            await this.config.addIndexes(this.collection, this.addIndexes);
        } else {
            console.info("No indexes to add");
        }

        await this.config.applySchemaValidation(this.collection, this.theSchema);

        // Load Test Data
        if (this.config.shouldLoadTestData() && (this.testData)) {
            const data = await this.config.getTestData(this.testData);
            await this.config.bulkLoad(this.collection, data);
        } else {
            console.info("Test data not requested");
        }

        await this.config.setVersion(this.collection, this.versionNumber.getVersionString())

        console.info("Version Applied Successfully", this.collection, this.versionNumber.getVersionString());
    }

    // Simple version number getter
    public getVersion(): VersionNumber {
        return this.versionNumber;
    }

    // Generic getter for testing
    public getThis(): any {
        return this;
    }


}