import { Collection } from 'mongodb';
import { Config } from '../../src/config/config';

describe('Config', () => {

    test('test constructor defaults', () => {
        let config = new Config();
        expect(config.getCollectionsFolder()).toBe("/opt/mongoSchemaManager/config/collections");
        expect(config.getCustomTypesFolder()).toBe("/opt/mongoSchemaManager/config/customTypes");
        expect(config.getSchemasFolder()).toBe("/opt/mongoSchemaManager/config/schemas");
        expect(config.getTestDataFolder()).toBe("/opt/mongoSchemaManager/config/testData");
        expect(config.getMsmTypesFolder()).toBe("/opt/mongoSchemaManager/msmTypes");
        expect(config.shouldLoadTestData()).toBe(false);
    });

    test('test constructor environment and file', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        let config = new Config();
        expect(config.getCollectionsFolder()).toBe("./test/resources/collections");
        expect(config.getMsmTypesFolder()).toBe("./src/msmTypes");
        expect(config.getEnumerators().enumerators.defaultStatus.Active).toBe("Not Deleted");
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