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
        collection = await config.getCollection(collectionName);
    });

    afterEach(async () => {
        await config.dropCollection(collectionName);
        await config.disconnect()
    });

    test('test getDatabase', async () => {
        expect(db.databaseName).toBe("test");
    });

    test('test getCollection', async () => {
        collection = await config.getCollection(collectionName);
        expect(collection.collectionName).toBe(collectionName);
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
        expect(appliedSchema).toStrictEqual({ "$jsonSchema": schema });

        // Clear schema validation
        await config.clearSchemaValidation(collectionName);

        // Verify schema validation is cleared
        appliedSchema = await config.getSchemaValidation(collectionName);
        expect(appliedSchema).toStrictEqual({});
    });

    test('test add/drop indexes', async () => {
        let indexes: {}[] = [
            {
                "name": "nameIndex",
                "key": { "userName": 1 },
                "options": { "unique": true }
            }, {
                "name": "typeIndex",
                "key": { "type": 1 },
                "options": { "unique": false }
            }
        ];
        let names: string[] = ["typeIndex"];

        await config.addIndexes(collectionName, indexes);
        let appliedIndexes = await config.getIndexes(collectionName);
        expect(appliedIndexes.some(index => index.name === "nameIndex")).toBe(true);
        expect(appliedIndexes.some(index => index.name === "typeIndex")).toBe(true);

        await config.dropIndexes(collectionName, names);
        appliedIndexes = await config.getIndexes(collectionName);
        expect(appliedIndexes.some(index => index.name === "nameIndex")).toBe(true);
        expect(appliedIndexes.some(index => index.name === "typeIndex")).toBe(false);

        await config.dropIndexes(collectionName, ["nameIndex"]);
        appliedIndexes = await config.getIndexes(collectionName);
        expect(appliedIndexes.some(index => index.name === "nameIndex")).toBe(false);
    });

    test('test executeAggregations', async () => {
        const document = { "firstName": "Foo", "lastName": "Bar" };
        const expectedOutput = { "name": "Foo Bar" };
        const aggregation1 = [
            {
                $addFields: {
                    name: {
                        $concat: ["$firstName", " ", "$lastName"]
                    }
                }
            },
            {
                $merge: {
                    into: collectionName,
                    on: "_id",
                    whenMatched: "replace",
                    whenNotMatched: "discard"
                }
            }
        ];

        const aggregation2 = [
            {
                $unset: ["firstName", "lastName"]
            },
            {
                $merge: {
                    into: collectionName,
                    on: "_id",
                    whenMatched: "replace",
                    whenNotMatched: "discard"
                }
            }
        ];
        const aggregations = [
            aggregation1,
            aggregation2
        ];

        await db.collection(collectionName).insertOne(document);
        await config.executeAggregations(collectionName, aggregations);
        let result = await db.collection(collectionName).find().toArray();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
        expect(result[0]).not.toHaveProperty("firstName");
        expect(result[0]).not.toHaveProperty("lastName");
        expect(result[0]).toHaveProperty("name");
        expect(result[0].name).toBe("Foo Bar")
    });

    test('test bulkLoad', async () => {
        const testData: any[] = ["TODO"];
        config.bulkLoad(collectionName, testData);
        const result: any[] = []; //mongodb get all
        expect(result).toStrictEqual(testData);
    });
});