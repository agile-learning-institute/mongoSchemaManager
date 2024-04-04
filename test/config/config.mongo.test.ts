/**
 * NOTE: This set of unit tests requires a mongodb 
 * You can run a mongo container with the following command
 * docker run -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=example --detach mongo:latest
 */
import { Config } from '../../src/config/Config';

describe('Config', () => {
    let config: Config;
    let collectionName = "testCollection";

    beforeEach(async () => {
        config = new Config();
        await config.connect();
    });

    afterEach(async () => {
        await config.disconnect()
    });

    afterAll(async () => {
        // config.getDatabase.DROP COLLECTION collectionName
    });

    test('test getCollection', async () => {
        let collection = config.getCollection(collectionName);
        expect(collection.collectionName).toBe(collectionName);
    });

    test('test getDatabase', async () => {
        let db = config.getDatabase();
        expect(db.databaseName).toBe("test");
    });

    test('test set/getVersion', async () => {
        let theVersion = await config.getVersion(collectionName);
        expect(theVersion).toBe("0.0.0");

        await config.setVersion(collectionName, "1.2.3");
        theVersion = await config.getVersion(collectionName);
        expect(theVersion).toBe("1.2.3");

        await config.setVersion(collectionName, "2.2.2");
        theVersion = await config.getVersion(collectionName);
        expect(theVersion).toBe("2.2.2");
    });

    test('test apply/remove schema validation', async () => {
        let applyedSchema = {};
        let schema = {
            "bsonType": "object",
            "properties": {
                "name": {
                    "description": "Name Description",
                    "bsonType": "string",
                }
            }
        };

        config.applySchemaValidation(collectionName, schema);
        applyedSchema = {}; // mongodb get schema
        expect(applyedSchema).toStrictEqual(schema);

        config.clearSchemaValidation(collectionName);
        applyedSchema = {}; // mongodb get schema
        expect(applyedSchema).toStrictEqual({});
    });

    test('test add/drop indexes', async () => {
        let appliedIndexes = [];
        let indexes = [

        ];
        let names = [

        ];

        config.addIndexes(indexes);
        appliedIndexes = []; // mongodb get indexes
        expect(appliedIndexes).toStrictEqual(indexes);

        config.dropIndexes(names);
        appliedIndexes = []; // mongodb get indexes
        expect(appliedIndexes).toStrictEqual([]);
    });

    test('test aexecuteAggregations', async () => {
        const aggregations = {

        };
        const expectedOutput = {

        };

        config.executeAggregations(aggregations);
        const result = {}; // mongodb get results
        expect(result).toStrictEqual(expectedOutput);
    });

    test('test bulkLoad', async () => {
        const testData = [];
        config.bulkLoad(collectionName, testData);
        const result = []; //mongodb get all
        expect(result).toStrictEqual(testData);
    });
});