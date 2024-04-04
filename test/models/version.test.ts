import { Config } from '../../src/config/config';
import { Version } from '../../src/models/version';

describe('Version', () => {

    test('test constructor simple', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        const version = { "version": "1.0.0" }
        const theVersion = new Version(config, "people", version);

        expect(theVersion.getVersion()).toBe("1.0.0");
        expect(theVersion.getSchema()["properties"]["name"]["description"]).toBe("VERSION document only");
    });

    test('test constructor testData', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
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
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        const version = {
            "version": "1.0.0",
            "dropIndexes": ["foo","bar"]
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