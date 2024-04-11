import { Config } from '../../src/config/Config';

describe('Config', () => {
    let config: Config;

    beforeEach(async () => {
        config = new Config();
    });

    test('test getDatabase', async () => {
        expect(() => config.getDatabase()).toThrow("Database not connected");
    });

    test('test getCollection', async () => {
        expect(() => config.getCollection("foo")).toThrow("Database not connected");
    });

    test('test dropCollection', async () => {
        expect(() => config.dropCollection("foo")).toThrow("Database not connected");
    });

    test('test setVersion', async () => {
        expect(() => config.setVersion("foo", "")).toThrow("Database not connected");
    });

    test('test getVersion', async () => {
        expect(() => config.getCollection("foo")).toThrow("Database not connected");
    });

    test('test applySchemaValidation', async () => {
        expect(() => config.applySchemaValidation("foo", {})).toThrow("Database not connected");
    });

    test('test getSchemaValidation', async () => {
        expect(() => config.getCollection("foo")).toThrow("Database not connected");
    });

    test('test clearSchemaValidation', async () => {
        expect(() => config.clearSchemaValidation("foo")).toThrow("Database not connected");
    });

    test('test addIndexes', async () => {
        expect(() => config.addIndexes("foo", [])).toThrow("Database not connected");
    });

    test('test getIndexes', async () => {
        expect(() => config.getIndexes("foo")).toThrow("Database not connected");
    });

    test('test dropIndexes', async () => {
        expect(() => config.dropIndexes("foo", [])).toThrow("Database not connected");
    });

    test('test executeAggregations', async () => {
        expect(() => config.executeAggregations("foo", {})).toThrow("Database not connected");
    });
});