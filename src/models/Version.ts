import { Config } from '../config/Config';
import { FileIO } from '../config/FileIO';
import { MongoIO } from '../config/MongoIO';
import { Schema } from './Schema';
import { VersionNumber } from './VersionNumber';

/**
 * This class is responsible for implementing a Version of a collection.
 * The apply method in this class is responsible processing a migration
 */
export class Version {
    private config: Config;
    private fileIO: FileIO;
    private mongoIO: MongoIO;
    private collection: string;
    private versionNumber: VersionNumber;
    private dropIndexes?: string[] = [];
    private aggregations?: object[][] = [];
    private addIndexes?: object[] = [];
    private testData?: string;
    private theSchema: any;
    private theSwagger: any;

    /**
     * The constructor initializes the instance, 
     * and retrieves the process schema needed by this version
     * 
     * @param config Dependency injection
     * @param collection The name of the collection
     * @param theVersion The version number
     */
    constructor(config: Config, mongoIO: MongoIO, fileIO: FileIO, collection: string, theVersion: any) {
        this.config = config;
        this.mongoIO = mongoIO;
        this.fileIO = fileIO;
        this.collection = collection;
        this.versionNumber = new VersionNumber(theVersion.version);
        Object.assign(this, theVersion);

        const schemaProcessor = new Schema(config, fileIO, this.collection, this.versionNumber);
        this.theSchema = schemaProcessor.getSchema();
        this.theSwagger = schemaProcessor.getSwagger();
    }

    /**
     * This is where the magic happens
     */
    public async apply(): Promise<void> {
        console.info("Applying", this.collection, this.versionNumber.getVersionString());

        await this.mongoIO.clearSchemaValidation(this.collection);

        // Drop indexes
        if ((this.dropIndexes) && (this.dropIndexes.length > 0)) {
            await this.mongoIO.dropIndexes(this.collection, this.dropIndexes);
        } else {
            console.info("No indexes to drop");
        }

        // Execute Aggregations
        if ((this.aggregations) && (this.aggregations.length > 0)) {
            await this.mongoIO.executeAggregations(this.collection, this.aggregations);
        } else {
            console.info("No aggregations to execute");
        }


        // Add Indexes
        if ((this.addIndexes) && (this.addIndexes.length > 0)) {
            await this.mongoIO.addIndexes(this.collection, this.addIndexes);
        } else {
            console.info("No indexes to add");
        }

        await this.mongoIO.applySchemaValidation(this.collection, this.theSchema);

        // Load Test Data
        if (this.config.shouldLoadTestData() && (this.testData)) {
            const data = await this.fileIO.getTestData(this.testData);
            await this.mongoIO.bulkLoad(this.collection, data);
        } else {
            console.info("Test data not requested");
        }

        await this.mongoIO.setVersion(this.collection, this.versionNumber.getVersionString())

        this.fileIO.saveSwagger(this.collection, this.versionNumber, this.theSwagger);

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