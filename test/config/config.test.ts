import { Collection } from 'mongodb';
import { Config } from '../../src/config/Config';

describe('Config', () => {

    test('test constructor defaults', () => {
        const config = new Config();

        expect(config.getConfigFolder()).toBe("/opt/mongoSchemaManager/config");
        expect(config.getMsmTypesFolder()).toBe("/opt/mongoSchemaManager/msmTypes");
        expect(config.shouldLoadTestData()).toBe(false);
    });

    test('test constructor environment and file', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        process.env.CONFIG_FOLDER = "";

        expect(config.getConfigFolder()).toBe("./test/resources");
        expect(config.getMsmTypesFolder()).toBe("./src/msmTypes");
    });

    test('test connect/disconnect', async () => {
        const config = new Config();
        expect(() => config.getCollection("foo")).toThrow("Database not connected");

        await config.connect();
        let collection = config.getCollection("foo");
        expect(collection.collectionName).toBe("foo");

        await config.disconnect();
        expect(() => config.getCollection("foo")).toThrow("Database not connected");
    });

    test('test getCollection', async () => {
        const config = new Config();
        expect(() => config.getCollection("foo")).toThrow("Database not connected");

        await config.connect();
        let collection = config.getCollection("foo");
        expect(collection.collectionName).toBe("foo");

        await config.disconnect();
        expect(() => config.getCollection("foo")).toThrow("Database not connected");
    });

    test('test getDatabase', async () => {
        const config = new Config();
        expect(() => config.getDatabase()).toThrow("Database not connected");

        await config.connect();
        let db = config.getDatabase();
        expect(db.databaseName).toBe("test");

        await config.disconnect();
        expect(() => config.getDatabase()).toThrow("Database not connected");
    });

    test('test getEnums', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        process.env.CONFIG_FOLDER = "";

        expect(config.getEnums("defaultStatus").Active).toBe("Not Deleted");
        expect(()=>config.getEnums("bad").Active).toThrow("Enumerator does not exist:bad");
    });

    test('test getCollectionFiles', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        process.env.CONFIG_FOLDER = "";

        const files = ["people.json", "plans.json"];
        expect(config.getCollectionFiles()).toStrictEqual(files);
    });

    test('test getCollectionFiles error', () => {
        const config = new Config();

        expect(()=>config.getCollectionFiles()).toThrow("ENOENT: no such file or directory, scandir '/opt/mongoSchemaManager/config/collections'");
    });

    test('test getCollectionConfig', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        process.env.CONFIG_FOLDER = "";

        const collectionConfig = config.getCollectionConfig("people.json");
        expect(collectionConfig.name).toBe("people");
        expect(collectionConfig.versions[0].version).toBe("1.0.0");
    });

    test('test getType', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        process.env.CONFIG_FOLDER = "";

        const type = config.getType("fullName");
        expect(type.bsonType).toBe("object");
    });

    test('test getSchema', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        process.env.CONFIG_FOLDER = "";

        const schema = config.getSchema("people", "1.0.0");
        expect(schema.bsonType).toBe("object");
    });

    test('test getTestData', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        process.env.CONFIG_FOLDER = "";

        expect(config.getTestData("people")[0].userName).toBe("JamesSmith");
    });

    test('test shouldLoadTestData', () => {
        let config = new Config();
        expect(config.shouldLoadTestData()).toBe(false);

        process.env.LOAD_TEST_DATA = "true";
        config = new Config();
        process.env.CONFIG_FOLDER = "";
        expect(config.shouldLoadTestData()).toBe(true);

        process.env.LOAD_TEST_DATA = "True";
        config = new Config();
        process.env.CONFIG_FOLDER = "";
        expect(config.shouldLoadTestData()).toBe(false);
    });
});