/**
 * NOTE: This set of unit tests requires a mongodb and uses the 
 *       testing data in the test/resources folder of this repo.
 */
import { Config } from '../../src/config/Config';

describe('Config', () => {
    let config: Config;

    // Clear all mocks before each test
    beforeEach(() => {
        process.env.CONFIG_FOLDER = "./test/resources";
        config = new Config();
        process.env.CONFIG_FOLDER = "";
    });

    test('test constructor defaults', () => {
        config = new Config();
        expect(config.getConfigFolder()).toBe("/opt/mongoSchemaManager/config");
        expect(config.getMsmTypesFolder()).toBe("/opt/mongoSchemaManager/msmTypes");
        expect(config.shouldLoadTestData()).toBe(false);
    });

    test('test constructor environment and file', () => {
        expect(config.getConfigFolder()).toBe("./test/resources");
        expect(config.getMsmTypesFolder()).toBe("./src/msmTypes");
    });

    test('test getEnums', () => {
        expect(config.getEnums("defaultStatus").Active).toBe("Not Deleted");
        expect(() => config.getEnums("bad").Active).toThrow("Enumerator does not exist:bad");
    });

    test('test getCollectionFiles', () => {
        const files = ["people.json", "plans.json"];
        expect(config.getCollectionFiles()).toStrictEqual(files);
    });

    test('test getCollectionFiles error', () => {
        const config = new Config();
        expect(() => config.getCollectionFiles()).toThrow("ENOENT: no such file or directory, scandir '/opt/mongoSchemaManager/config/collections'");
    });

    test('test getCollectionConfig', () => {
        const collectionConfig = config.getCollectionConfig("people.json");
        expect(collectionConfig.name).toBe("people");
        expect(collectionConfig.versions[0].version).toBe("1.0.0");
    });

    test('test getType', () => {
        const type = config.getType("fullName");
        expect(type.bsonType).toBe("object");
    });

    test('test getSchema', () => {
        const schema = config.getSchema("people", "1.0.0");
        expect(schema.bsonType).toBe("object");
    });

    test('test getTestData', () => {
        expect(config.getTestData("people")[0].userName).toBe("JamesSmith");
    });

    test('test shouldLoadTestData', () => {
        config = new Config();
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