/**
 * NOTE: This set of unit tests uses the testing data 
 *       in the test/resources folder of this repo.
 */
import { Config } from './Config';
import { FileIO } from "./FileIO";
import { VersionNumber } from '../models/VersionNumber';
import { join } from 'path';
import { unlinkSync, existsSync, readFileSync, statSync } from "fs";
import * as yaml from 'js-yaml';

describe('Config', () => {
    let config: Config;
    let fileIO: FileIO;
    let versionNumber = new VersionNumber("1.0.0.0");

    // Clear all mocks before each test
    beforeEach(() => {
        process.env.CONFIG_FOLDER = "./test/resources";
        process.env.MSM_ROOT = "./src";
        config = new Config();
        fileIO = new FileIO(config);
        process.env.MSM_ROOT = "";
        process.env.CONFIG_FOLDER = "";
    });

    test('test attach files', () => {
        fileIO.attachFiles()
        expect(config.getEnums(1,"defaultStatus")).toStrictEqual({"Active":"Not Deleted","Archived":"Soft Delete Indicator"})
        assertFolderExists("./src/msmTypes");
        assertFolderExists("./test/resources");
        assertFolderExists("./test/resources/collections");
        assertFolderExists("./test/resources/schemas");
        assertFolderExists("./test/resources/customTypes");
        assertFolderExists("./test/resources/testData");
        assertFolderExists("./test/resources/openApi");

        function assertFolderExists(folderName: string) {
            expect(existsSync(folderName)).toBeTruthy();
            expect(statSync(folderName).isDirectory()).toBeTruthy();
        }
    });

    test('test configureApp', () => {
        const versions = [{"collectionName":"foo", "currentVersion":"1.0.0.0"}];
        const apiFolder = "./test/resources/openApi"
        fileIO.configureApp(versions);

        expect(existsSync(join(apiFolder, "index.html"))).toBeTruthy();
        expect(existsSync(join(apiFolder, "versions.json"))).toBeTruthy();
    });

    test('test getCollectionConfig', () => {
        const collectionConfig = fileIO.getCollectionConfig("sample.json");
        expect(collectionConfig.name).toBe("sample");
        expect(collectionConfig.versions[0].version).toBe("1.0.0.1");
    });

    test('test getCollectionFiles', () => {
        const files = ["sample.json","test.json",];
        expect(fileIO.getCollectionFiles()).toStrictEqual(files);
    });

    test('test getSchema', () => {
        const schema = fileIO.getSchema("sample", new VersionNumber("1.0.0.0"));
        expect(schema.bsonType).toBe("object");
    });

    test('test getTestData', () => {
        expect(fileIO.getTestData("sample-1.0.0.1")[0].userName).toBe("Jane Doe");
    });

    test('test getType', () => {
        const type = fileIO.getType("fullName");
        expect(type.bsonType).toBe("object");
    });

    test('test readEnumeratorsFile', () => {
        const enumerators = fileIO.readEnumeratorsFile();
        expect(enumerators[1].version).toBe(1);
    });

    test('test saveSwagger', () => {
        const swagger = {"foo":"bar"};
        fileIO.saveSwagger("unittest", versionNumber, swagger);
        const fileName = join(config.getOpenApiFolder(), "unittest-" + versionNumber.getVersionString() + ".openapi.yaml");
        const result = yaml.load(readFileSync(fileName, 'utf8'));
        expect(result).toStrictEqual(swagger);
        unlinkSync(fileName);
    });
});