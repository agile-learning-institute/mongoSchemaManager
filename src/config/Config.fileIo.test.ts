/**
 * NOTE: This set of unit tests uses the testing data 
 *       in the test/resources folder of this repo.
 */
import { Config } from './Config';
import { VersionNumber } from '../models/VersionNumber';

describe('Config', () => {
    let config: Config;

    // Clear all mocks before each test
    beforeEach(() => {
        process.env.CONFIG_FOLDER = "./test/resources";
        process.env.MSM_ROOT = "./src";
        config = new Config();
        process.env.MSM_ROOT = "";
        process.env.CONFIG_FOLDER = "";
    });

    test('test constructor defaults', () => {
        config = new Config();
        expect(config.getConfigFolder()).toBe("/opt/mongoSchemaManager/configurations");
        expect(config.getMsmTypesFolder()).toBe("/opt/mongoSchemaManager/msmTypes");
        expect(config.shouldLoadTestData()).toBe(false);
    });

    test('test constructor environment and file', () => {
        expect(config.getConfigFolder()).toBe("./test/resources");
        expect(config.getMsmTypesFolder()).toBe("src/msmTypes");
    });

    test('test getEnums', () => {
        expect(config.getEnums(1, "defaultStatus").Active).toBe("Not Deleted");
        expect(() => config.getEnums(0, "bad")).toThrow("Enumerator does not exist:bad");
    });

    // test('test getEnumerators', () => {
    //     expect(config.getEnumerators()[0].status).toBe("Depricated");
    // });

    test('test getCollectionFiles', () => {
        const files = ["sample.json"];
        expect(config.getCollectionFiles()).toStrictEqual(files);
    });

    test('test getCollectionFiles error', () => {
        const config = new Config();
        expect(() => config.getCollectionFiles()).toThrow("ENOENT: no such file or directory, scandir '/opt/mongoSchemaManager/configurations/collections'");
    });

    test('test getCollectionConfig', () => {
        const collectionConfig = config.getCollectionConfig("sample.json");
        expect(collectionConfig.name).toBe("sample");
        expect(collectionConfig.versions[0].version).toBe("1.0.0.1");
    });

    test('test getType', () => {
        const type = config.getType("fullName");
        expect(type.bsonType).toBe("object");
    });

    test('test getSchema', () => {
        const schema = config.getSchema("sample", new VersionNumber("1.0.0.0"));
        expect(schema.bsonType).toBe("object");
    });

    test('test getTestData', () => {
        expect(config.getTestData("sample-1.0.0.1")[0].userName).toBe("Jane Doe");
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