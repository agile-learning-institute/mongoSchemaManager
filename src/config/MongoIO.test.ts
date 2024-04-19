/**
 * NOTE: This set of unit tests requires a mongodb 
 * You can run a mongo container with the following command
 * docker run -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=example --detach mongo:latest
 */
import { MongoIO } from './MongoIO';
import { Config } from './Config';
import { Collection, Db } from 'mongodb';

describe('Config', () => {
    let config: Config;
    let mongoIo: MongoIO;
    
    let collectionName = "testCollection";
    let db: Db;
    let collection: Collection;

    beforeEach(async () => {
        config = new Config();
        mongoIo = new MongoIO(config);

        await mongoIo.connect();
        db = mongoIo.getDatabase();
        collection = await mongoIo.getCollection(collectionName);
        await mongoIo.dropCollection("msmCurrentVersions");
    });

    afterEach(async () => {
        await mongoIo.dropCollection(collectionName);
        await mongoIo.dropCollection("msmCurrentVersions");
        await mongoIo.disconnect()
    });

    test('test getDatabase', async () => {
        expect(db.databaseName).toBe("test");
    });

    test('test getCollection', async () => {
        collection = await mongoIo.getCollection(collectionName);
        expect(collection.collectionName).toBe(collectionName);
    });

    test('test set/getVersionData', async () => {
        // Make sure we start with an empty collection
        let result = await mongoIo.getVersionData();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
    });

    test('test set/getVersion', async () => {
        // Make sure we start with an empty collection
        let result = await db.collection("msmCurrentVersions").find().toArray();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);

        // Get default when not found
        let theVersion = await mongoIo.getVersion("sample");
        expect(theVersion).toBe("0.0.0.0");

        // Insert Version
        await mongoIo.setVersion("sample", "1.2.3.4");
        theVersion = await mongoIo.getVersion("sample");
        expect(theVersion).toBe("1.2.3.4");

        // Update Version
        await mongoIo.setVersion("sample", "4.3.2.1");
        theVersion = await mongoIo.getVersion("sample");
        expect(theVersion).toBe("4.3.2.1");

        // Add another collection Version
        await mongoIo.setVersion("test", "1.0.0.0");

        // Test all results
        // let expected = [{"collectionName":"sample", "currentVersion":"4.3.2.1"},{"collectionName":"test", "currentVersion":"1.0.0.0"}];
        result = await db.collection("msmCurrentVersions").find().toArray();
        expect(result[0].collectionName).toBe("sample");
        expect(result[0].currentVersion).toBe("4.3.2.1");
        expect(result[1].collectionName).toBe("test");
        expect(result[1].currentVersion).toBe("1.0.0.0");
    });

    test('test apply/remove schema validation', async () => {
        const schema = {bsonType:"object",properties:{name:{description:"Name Description",bsonType:"string"}}};

        mongoIo.applySchemaValidation(collectionName, schema);
        let appliedSchema = await mongoIo.getSchemaValidation(collectionName);
        expect(appliedSchema).toStrictEqual({ "$jsonSchema": schema });

        await mongoIo.clearSchemaValidation(collectionName);
        appliedSchema = await mongoIo.getSchemaValidation(collectionName);
        expect(appliedSchema).toStrictEqual({});
    });

    test('test add/drop indexes', async () => {
        let indexes: {}[] = [{"name":"nameIndex","key":{"userName":1},"options":{"unique":true}},{"name":"typeIndex","key":{"type":1},"options":{"unique":false}}];
        let names: string[] = ["typeIndex"];

        await mongoIo.addIndexes(collectionName, indexes);
        let appliedIndexes = await mongoIo.getIndexes(collectionName);
        expect(appliedIndexes.some(index => index.name === "nameIndex")).toBe(true);
        expect(appliedIndexes.some(index => index.name === "typeIndex")).toBe(true);

        await mongoIo.dropIndexes(collectionName, names);
        appliedIndexes = await mongoIo.getIndexes(collectionName);
        expect(appliedIndexes.some(index => index.name === "nameIndex")).toBe(true);
        expect(appliedIndexes.some(index => index.name === "typeIndex")).toBe(false);

        await mongoIo.dropIndexes(collectionName, ["nameIndex"]);
        appliedIndexes = await mongoIo.getIndexes(collectionName);
        expect(appliedIndexes.some(index => index.name === "nameIndex")).toBe(false);
    });

    test('test executeAggregations', async () => {
        const document = { "firstName": "Foo", "lastName": "Bar" };
        const expectedOutput = { "name": "Foo Bar" };
        const aggregation1 = [{$addFields:{name:{$concat:["$firstName"," ","$lastName"]}}},{$merge:{into:collectionName,on:"_id",whenMatched:"replace",whenNotMatched:"discard"}}];
        const aggregation2 = [{$unset:["firstName","lastName"]},{$merge:{into:collectionName,on:"_id",whenMatched:"replace",whenNotMatched:"discard"}}];
        const aggregations = [aggregation1,aggregation2];

        await db.collection(collectionName).insertOne(document);
        await mongoIo.executeAggregations(collectionName, aggregations);
        let result = await db.collection(collectionName).find().toArray();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
        expect(result[0]).not.toHaveProperty("firstName");
        expect(result[0]).not.toHaveProperty("lastName");
        expect(result[0]).toHaveProperty("name");
        expect(result[0].name).toBe("Foo Bar")
    });

    test('test bulkLoad', async () => {
        const testData: any[] = [
            {"firstName":"Foo", "lastName":"Bar"},
            {"firstName":"Fab", "lastName":"Far"},
            {"firstName":"Bab", "lastName":"Baf"}
        ];
        await mongoIo.bulkLoad(collectionName, testData);
        let result = await db.collection(collectionName).find().toArray();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(3);
        expect(result[0].firstName).toBe("Foo");
        expect(result[1].firstName).toBe("Fab");
        expect(result[2].firstName).toBe("Bab");
    });

});