/**
 * NOTE: This set of unit tests requires a mongodb 
 * You can run a mongo container with the following command
 * docker run -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=example --detach mongo:latest
 */
import { Collection, Db } from 'mongodb';
import { Config } from '../../src/config/Config';

describe('Config', () => {
    let config: Config;
    let collectionName = "testCollection";
    let db: Db;
    let collection: Collection;

    beforeEach(async () => {
        config = new Config();
        await config.connect();
        db = config.getDatabase();
        collection = config.getCollection(collectionName);
    });

    afterEach(async () => {
        await config.dropCollection(collectionName);
        await config.disconnect()
    });

    test('test getCollection', async () => {
        expect(collection.collectionName).toBe(collectionName);
    });

    test('test getDatabase', async () => {
        expect(db.databaseName).toBe("test");
    });

    test('test set/getVersion', async () => {
        let theVersion = await config.getVersion(collectionName);
        expect(theVersion).toBe("0.0.0.0");

        await config.setVersion(collectionName, "1.2.3.4");
        theVersion = await config.getVersion(collectionName);
        expect(theVersion).toBe("1.2.3.4");

        await config.setVersion(collectionName, "2.2.2.2");
        theVersion = await config.getVersion(collectionName);
        expect(theVersion).toBe("2.2.2.2");
    });

    test('test apply/remove schema validation', async () => {
        const schema = {
            bsonType: "object",
            properties: {
                name: {
                    description: "Name Description",
                    bsonType: "string",
                }
            }
        };

        // Apply schema validation
        config.applySchemaValidation(collectionName, schema);

        // Get the applied schema
        let appliedSchema = await config.getSchemaValidation(collectionName);
        expect(appliedSchema).toStrictEqual(schema);

        // Clear schema validation
        config.clearSchemaValidation(collectionName);

        // Verify schema validation is cleared
        appliedSchema = await config.getSchemaValidation(collectionName);
        expect(appliedSchema).toStrictEqual({});
    });

    test('test add/drop indexes', async () => {
        let indexes: {}[] = [{"TO":"DO"}];
        let names: {}[] = [{"TO":"DO"}];

        config.addIndexes(collectionName, indexes);
        let appliedIndexes = config.getIndexes(collectionName);
        expect(appliedIndexes).toStrictEqual(indexes);

        config.dropIndexes(names);
        appliedIndexes = config.getIndexes(collectionName);
        expect(appliedIndexes).toStrictEqual([]);
    });

    test('test aexecuteAggregations', async () => {
        const aggregations = {"TO":"DO"};
        const expectedOutput = {"TO":"DO"};

        config.executeAggregations(collectionName, aggregations);
        const result = {}; // mongodb get results
        expect(result).toStrictEqual(expectedOutput);
    });

    test('test bulkLoad', async () => {
        const testData: any[] = ["TODO"];
        config.bulkLoad(collectionName, testData);
        const result: any[] = []; //mongodb get all
        expect(result).toStrictEqual(testData);
    });
});