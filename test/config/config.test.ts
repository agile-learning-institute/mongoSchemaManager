import { Collection } from 'mongodb';
import { Config } from '../../src/config/config';

describe('Config', () => {

    test('test constructor defaults', () => {
        let config = new Config();

        expect(config.getCollectionsFolder()).toBe("/opt/mongoSchemaManager/config/collections");
        expect(config.getCustomTypesFile("foo")).toBe("/opt/mongoSchemaManager/config/customTypes/foo.json");
        expect(config.getSchemasFile("foo","1.0.0")).toBe("/opt/mongoSchemaManager/config/schemas/foo-1.0.0.json");
        expect(config.getTestDataFile("foo","1.0.0")).toBe("/opt/mongoSchemaManager/config/testData/foo-1.0.0.json");
        expect(config.shouldLoadTestData()).toBe(false);
    });

    test('test constructor environment and file', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        let config = new Config();
        expect(config.getCollectionsFolder()).toBe("test/resources/collections");
        expect(config.getTypeFile("msmWord")).toBe("src/msmTypes/msmWord.json");
    });

    test('test getEnums', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        let config = new Config();
        expect(config.getEnums("defaultStatus").Active).toBe("Not Deleted");
        expect(()=>config.getEnums("bad").Active).toThrow("Enumerator does not exist:bad");
    });

    test('test getTypeFile', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        let config = new Config();
        expect(config.getTypeFile("msmWord")).toBe("src/msmTypes/msmWord.json");
        expect(config.getTypeFile("fullName")).toBe("test/resources/customTypes/fullName.json");
        expect(()=>config.getTypeFile("foo")).toThrow("Type Not Found:foo");
    });

    test('test getDatabase', async () => {
        let config = new Config();
        expect(() => config.getDatabase()).toThrow("Database not connected");

        await config.connect();
        let db = config.getDatabase();
        expect(db.databaseName).toBe("test");

        await config.disconnect();
        expect(() => config.getDatabase()).toThrow("Database not connected");
    });

    test('test getCollection', async () => {
        let config = new Config();
        expect(() => config.getCollection("foo")).toThrow("Database not connected");

        await config.connect();
        let collection = config.getCollection("foo");
        expect(collection.collectionName).toBe("foo");

        await config.disconnect();
        expect(() => config.getCollection("foo")).toThrow("Database not connected");
    });

});