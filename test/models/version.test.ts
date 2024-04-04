import { Config } from '../../src/config/Config';
import { Version } from '../../src/models/Version';

jest.mock('../../src/config/Config', () => {
    return {
        Config: jest.fn().mockImplementation(() => ({
            clearSchemaValidation: jest.fn(),
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
                        "pattern": "foo",
                    }
                }
            }),
        }))
    };
});

describe('Version', () => {
    let config: Config;
    let version: Version;
  
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
  
      // Instantiate Config and Version for testing
      config = new Config();
      version = new Version(config, 'testCollection', {
        version: '1.0.0',
        dropIndexes: ['index1', 'index2'],
        aggregations: [{ /* Mock aggregation */ }],
        addIndexes: [{ /* Mock index */ }],
        testData: 'testData',
      });
  
    });
  
    test('test constructor simple', () => {
        const config = new Config();
        const version = { "version": "1.0.0" }
        const theVersion = new Version(config, "people", version);

        expect(theVersion.getThis().version).toBe("1.0.0");
        expect(theVersion.getThis().theSchema["properties"]["name"]["description"]).toBe("aDescription");
    });

    test('test constructor testData', () => {
        const config = new Config();
        const version = {
            "version": "1.0.0",
            "testData": "somefilename"
        };
        const theVersion = new Version(config, "people", version);

        expect(theVersion.getVersion()).toBe("1.0.0");
        expect(theVersion.getThis().testData).toBe("somefilename");
    });

    test('test constructor dropIndexes', () => {
        const config = new Config();
        const version = {
            "version": "1.0.0",
            "dropIndexes": ["foo", "bar"]
        };
        const theVersion = new Version(config, "people", version);

        expect(theVersion.getVersion()).toBe("1.0.0");
        expect(theVersion.getThis().dropIndexes.length).toBe(2);
        expect(theVersion.getThis().dropIndexes[0]).toBe("foo");
        expect(theVersion.getThis().dropIndexes[1]).toBe("bar");
    });

    test('test constructor addIndexes', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        const version = {
            "version": "1.0.0",
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

        expect(theVersion.getVersion()).toBe("1.0.0");
        expect(theVersion.getThis().addIndexes.length).toBe(2);
        expect(theVersion.getThis().addIndexes[0].keys).toStrictEqual({ "userName": 1 });
        expect(theVersion.getThis().addIndexes[1].keys).toStrictEqual({ "status": 1 });
    });

    test('test constructor aggregations', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        const version = {
            "version": "1.0.0",
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
        const theVersion = new Version(config, "people", version);

        expect(theVersion.getVersion()).toBe("1.0.0");
        expect(theVersion.getThis().aggregations.length).toBe(2);
        expect(theVersion.getThis().aggregations[0][0].$match).toBe("match1");
        expect(theVersion.getThis().aggregations[1][0].$match).toBe("match2");
    });
});