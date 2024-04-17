/**
 * NOTE: This set of unit tests requires a mongodb 
 * You can run a mongo container with the following command
 * docker run -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=example --detach mongo:latest
 */
import { Collection, Db } from 'mongodb';
import { Config } from './Config';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

describe('Config', () => {
    let config: Config;
    let collectionName = "testCollection";
    let db: Db;
    let collection: Collection;

    beforeEach(async () => {
        process.env.MSM_ROOT = "./src";
        process.env.CONFIG_FOLDER = "./test/resources";
        config = new Config();
        process.env.MSM_ROOT = "";
        process.env.CONFIG_FOLDER = "";

        await config.connect();
        db = config.getDatabase();
        collection = await config.getCollection(collectionName);
        await config.dropCollection("msmCurrentVersions");
    });

    afterEach(async () => {
        await config.dropCollection(collectionName);
        await config.dropCollection("msmCurrentVersions");
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
        // Make sure we start with an empty collection
        let result = await db.collection("msmCurrentVersions").find().toArray();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);

        // Get default when not found
        let theVersion = await config.getVersion("sample");
        expect(theVersion).toBe("0.0.0.0");

        // Insert Version
        await config.setVersion("sample", "1.2.3.4");
        theVersion = await config.getVersion("sample");
        expect(theVersion).toBe("1.2.3.4");

        // Update Version
        await config.setVersion("sample", "4.3.2.1");
        theVersion = await config.getVersion("sample");
        expect(theVersion).toBe("4.3.2.1");

        // Add another collection Version
        await config.setVersion("test", "1.0.0.0");

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

        config.applySchemaValidation(collectionName, schema);
        let appliedSchema = await config.getSchemaValidation(collectionName);
        expect(appliedSchema).toStrictEqual({ "$jsonSchema": schema });

        await config.clearSchemaValidation(collectionName);
        appliedSchema = await config.getSchemaValidation(collectionName);
        expect(appliedSchema).toStrictEqual({});
    });

    test('test add/drop indexes', async () => {
        let indexes: {}[] = [{"name":"nameIndex","key":{"userName":1},"options":{"unique":true}},{"name":"typeIndex","key":{"type":1},"options":{"unique":false}}];
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
        const aggregation1 = [{$addFields:{name:{$concat:["$firstName"," ","$lastName"]}}},{$merge:{into:collectionName,on:"_id",whenMatched:"replace",whenNotMatched:"discard"}}];
        const aggregation2 = [{$unset:["firstName","lastName"]},{$merge:{into:collectionName,on:"_id",whenMatched:"replace",whenNotMatched:"discard"}}];
        const aggregations = [aggregation1,aggregation2];

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
        const testData: any[] = [
            {"firstName":"Foo", "lastName":"Bar"},
            {"firstName":"Fab", "lastName":"Far"},
            {"firstName":"Bab", "lastName":"Baf"}
        ];
        await config.bulkLoad(collectionName, testData);
        let result = await db.collection(collectionName).find().toArray();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(3);
        expect(result[0].firstName).toBe("Foo");
        expect(result[1].firstName).toBe("Fab");
        expect(result[2].firstName).toBe("Bab");
    });

    test('test configureApp', async () => {
        await config.configureApp();

        const indexFile = join(config.getOpenApiFolder(),"index.html");
        const versionFile = join(config.getOpenApiFolder(),"versions.json");
        expect(existsSync(indexFile)).toBe(true);
        expect(existsSync(versionFile)).toBe(true);

        unlinkSync(indexFile);
        unlinkSync(versionFile);
    });

});