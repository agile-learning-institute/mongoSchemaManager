import { Config } from '../config/Config';
import { FileIO } from '../config/FileIO';
import { MongoIO } from '../config/MongoIO';
import { Version } from './Version';
import { VersionNumber } from './VersionNumber';

jest.mock('../config/Config', () => {
    return {
        Config: jest.fn().mockImplementation(() => ({
            shouldLoadTestData: jest.fn().mockReturnValue(true),
        }))
    };
});

jest.mock('../config/MongoIO', () => {
    return {
        MongoIO: jest.fn().mockImplementation(() => ({
            clearSchemaValidation: jest.fn(),
            getSchema: jest.fn().mockReturnValue({"bsonType":"object","properties":{"name":{"description":"aDescription","msmType":"msmWord"}}}),
            dropIndexes: jest.fn().mockResolvedValue(undefined),
            executeAggregations: jest.fn().mockResolvedValue(undefined),
            addIndexes: jest.fn(),
            applySchemaValidation: jest.fn(),
            bulkLoad: jest.fn().mockResolvedValue(undefined),
            setVersion: jest.fn()
        }))
    };
});

jest.mock('../config/FileIO', () => {
    return {
        FileIO: jest.fn().mockImplementation(() => ({
            getTestData: jest.fn().mockReturnValue([{"foo":"bar"}]),
            saveSwagger: jest.fn()
        }))
    };
});

jest.mock('./Schema', () => {
    return {
        Schema: jest.fn().mockImplementation(() => ({
            getSwagger: jest.fn(),
            getSchema: jest.fn().mockReturnValue({"bsonType":"object","properties":{"name":{"description":"aDescription","bsonType":"string"}}})
        }))
    };
});

describe('Version', () => {
    let config: jest.Mocked<Config>;
    let fileIO: jest.Mocked<FileIO>;
    let mongoIO: jest.Mocked<MongoIO>;
    const expectedVersion = new VersionNumber("1.0.0.0");

    beforeEach(() => {
        jest.clearAllMocks();
        config = new Config() as jest.Mocked<Config>;
        fileIO = new FileIO(config) as jest.Mocked<FileIO>;
        mongoIO = new MongoIO(config) as jest.Mocked<MongoIO>;
    });

    test('test constructor simple', () => {
        const versionData = { "version": "1.0.0.0" };
        const theVersion = new Version(config, mongoIO, fileIO, "people", versionData);

        expect(theVersion.getVersion()).toStrictEqual(expectedVersion);
        expect(theVersion.getThis().theSchema["properties"]["name"]["description"]).toBe("aDescription");
    });

    test('test bulk load testData', async () => {
        const versionData = {
            "version": "1.0.0.0",
            "testData": "somefilename"
        };
        const theVersion = new Version(config, mongoIO, fileIO, "people", versionData);
        expect(theVersion.getVersion()).toStrictEqual(expectedVersion);
        expect(theVersion.getThis().testData).toBe("somefilename");

        await theVersion.apply();
        expect(mongoIO.bulkLoad).toHaveBeenCalledTimes(1);
    });

    test('test drop indexes', async () => {
        const versionData = {
            "version": "1.0.0.0",
            "dropIndexes": ["one", "two"]
        };
        const theVersion = new Version(config, mongoIO, fileIO, "people", versionData);
        expect(theVersion.getVersion()).toStrictEqual(expectedVersion);
        expect(theVersion.getThis().dropIndexes).toStrictEqual(["one", "two"]);

        await theVersion.apply();
        expect(mongoIO.dropIndexes).toHaveBeenCalledTimes(1);
    });

    test('test add indexes', async () => {
        const versionData = {
            "version": "1.0.0.0",
            "addIndexes": ["one", "two"]
        };
        const theVersion = new Version(config, mongoIO, fileIO, "people", versionData);
        expect(theVersion.getVersion()).toStrictEqual(expectedVersion);
        expect(theVersion.getThis().addIndexes).toStrictEqual(["one", "two"]);

        await theVersion.apply();
        expect(mongoIO.addIndexes).toHaveBeenCalledTimes(1);
    });

    test('test aggregations indexes', async () => {
        const versionData = {
            "version": "1.0.0.0",
            "aggregations": ["one", "two"]
        };
        const theVersion = new Version(config, mongoIO, fileIO, "people", versionData);
        expect(theVersion.getVersion()).toStrictEqual(expectedVersion);
        expect(theVersion.getThis().aggregations).toStrictEqual(["one", "two"]);

        await theVersion.apply();
        expect(mongoIO.executeAggregations).toHaveBeenCalledTimes(1);
    });

    test('test dropIndexes', () => {
        const versionData = {
            "version": "1.0.0.0",
            "dropIndexes": ["foo", "bar"]
        };
        const theVersion = new Version(config, mongoIO, fileIO, "people", versionData);

        expect(theVersion.getVersion()).toStrictEqual(expectedVersion);
        expect(theVersion.getThis().dropIndexes.length).toBe(2);
        expect(theVersion.getThis().dropIndexes[0]).toBe("foo");
        expect(theVersion.getThis().dropIndexes[1]).toBe("bar");
    });

    test('test addIndexes', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        const version = {
            "version": "1.0.0.0",
            "addIndexes": [
                {
                    "keys": { "userName": 1 },
                    "options": { "unique": true }
                },
                {
                    "keys": { "status": 1 },
                    "options": { "unique": false }
                }
            ]
        };
        const theVersion = new Version(config, mongoIO, fileIO, "people", version);

        expect(theVersion.getVersion()).toStrictEqual(expectedVersion);
        expect(theVersion.getThis().addIndexes.length).toBe(2);
        expect(theVersion.getThis().addIndexes[0].keys).toStrictEqual({ "userName": 1 });
        expect(theVersion.getThis().addIndexes[1].keys).toStrictEqual({ "status": 1 });
    });

    test('test aggregations', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        const versionData = {
            "version": "1.0.0.0",
            "aggregations": [
                [
                    { "$match": "match1" },
                    { "$sort": "sort1" },
                ],
                [
                    { "$match": "match2" },
                    { "$project": "project2" },
                ]
            ]
        };
        const theVersion = new Version(config, mongoIO, fileIO, "people", versionData);

        expect(theVersion.getVersion()).toStrictEqual(expectedVersion);
        expect(theVersion.getThis().aggregations.length).toBe(2);
        expect(theVersion.getThis().aggregations[0][0].$match).toBe("match1");
        expect(theVersion.getThis().aggregations[1][0].$match).toBe("match2");
    });

    test('process should call saveSwagger', async () => {
        const versionData = { "version": "1.0.0.0" };
        const theVersion = new Version(config, mongoIO, fileIO, "people", versionData);
        await theVersion.apply()

        expect(mongoIO.clearSchemaValidation).toHaveBeenCalledTimes(1);
        expect(mongoIO.applySchemaValidation).toHaveBeenCalledTimes(1);
        expect(mongoIO.setVersion).toHaveBeenCalledTimes(1);
        expect(fileIO.saveSwagger).toHaveBeenCalledTimes(1);
    });
});