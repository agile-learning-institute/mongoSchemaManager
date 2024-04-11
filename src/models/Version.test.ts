import { Config } from '../Config/Config';
import { Version } from './Version';
import { VersionNumber } from './VersionNumber';

jest.mock('../../src/config/Config', () => {
    return {
        Config: jest.fn().mockImplementation(() => ({
            clearSchemaValidation: jest.fn(),
            getSchema: jest.fn().mockReturnValue({
                "bsonType": "object",
                "properties": {
                    "name": {
                        "description": "aDescription",
                        "msmType": "msmWord"
                    }
                }
            }),
            dropIndexes: jest.fn(),
            executeAggregations: jest.fn(),
            addIndexes: jest.fn(),
            applySchemaValidation: jest.fn(),
            shouldLoadTestData: jest.fn().mockReturnValue(true), 
            bulkLoad: jest.fn(),
            setVersion: jest.fn(),
        }))
    };
});

jest.mock('../../src/models/Schema', () => {
    return {
        Schema: jest.fn().mockImplementation(() => ({
            getSchema: jest.fn().mockReturnValue({
                "bsonType": "object",
                "properties": {
                    "name": {
                        "description": "aDescription",
                        "bsonType": "string",
                    }
                }
            })
        }))
    };
});

describe('Version', () => {
    let config: Config;
    const expectedVersion = new VersionNumber("1.0.0.0");
  
    beforeEach(() => {
      jest.clearAllMocks();
      config = new Config();
    });
  
    test('test constructor simple', () => {
        const versionData = {"version": "1.0.0.0"};
        const theVersion = new Version(config, "people", versionData);

        expect(theVersion.getVersion()).toStrictEqual(expectedVersion);
        expect(theVersion.getThis().theSchema["properties"]["name"]["description"]).toBe("aDescription");
    });

    test('test testData', () => {
        const versionData = {
            "version": "1.0.0.0",
            "testData": "somefilename"
        };
        const theVersion = new Version(config, "people", versionData);

        expect(theVersion.getVersion()).toStrictEqual(expectedVersion);
        expect(theVersion.getThis().testData).toBe("somefilename");
    });

    test('test dropIndexes', () => {
        const versionData = {
            "version": "1.0.0.0",
            "dropIndexes": ["foo", "bar"]
        };
        const theVersion = new Version(config, "people", versionData);

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
        const theVersion = new Version(config, "people", version);

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
        const theVersion = new Version(config, "people", versionData);

        expect(theVersion.getVersion()).toStrictEqual(expectedVersion);
        expect(theVersion.getThis().aggregations.length).toBe(2);
        expect(theVersion.getThis().aggregations[0][0].$match).toBe("match1");
        expect(theVersion.getThis().aggregations[1][0].$match).toBe("match2");
    });
});