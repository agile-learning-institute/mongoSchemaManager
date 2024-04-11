import { Config } from './Config';

describe('Config', () => {
    let config: Config;

    beforeEach(async () => {
        try { config = new Config(); } catch (error) {}
    });

    test('test getDatabase', async () => {
        expect(() => config.getDatabase()).toThrow("Database not connected");
    });

    test('test getCollection', async () => {
        await expect(() => config.getCollection("foo")).rejects.toThrow("Database not connected");
    });

    test('test dropCollection', async () => {
        await expect(() => config.dropCollection("foo")).rejects.toThrow("Database not connected");
    });

    test('test setVersion', async () => {
        await expect(() => config.setVersion("foo", "")).rejects.toThrow("Database not connected");
    });

    test('test getVersion', async () => {
        await expect(() => config.getCollection("foo")).rejects.toThrow("Database not connected");
    });

    test('test applySchemaValidation', async () => {
        await expect(() => config.applySchemaValidation("foo", {})).rejects.toThrow("Database not connected");
    });

    test('test getSchemaValidation', async () => {
        await expect(() => config.getCollection("foo")).rejects.toThrow("Database not connected");
    });

    test('test clearSchemaValidation', async () => {
        await expect(() => config.clearSchemaValidation("foo")).rejects.toThrow("Database not connected");
    });

    test('test addIndexes', async () => {
        await expect(() => config.addIndexes("foo", [])).rejects.toThrow("Database not connected");
    });

    test('test getIndexes', async () => {
        await expect(() => config.getIndexes("foo")).rejects.toThrow("Database not connected");
    });

    test('test dropIndexes', async () => {
        await expect(() => config.dropIndexes("foo", [])).rejects.toThrow("Database not connected");
    });

    test('test executeAggregations', async () => {
        await expect(() => config.executeAggregations("foo", [])).rejects.toThrow("Database not connected");
    });
});