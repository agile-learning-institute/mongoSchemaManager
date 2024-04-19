import { MongoIO } from './MongoIO';
import { Config } from './Config';


describe('Config', () => {
    let config: Config;
    let mongoIo: MongoIO;

    beforeEach(async () => {
        config = new Config();
        mongoIo = new MongoIO(config);
    });

    test('test getDatabase', async () => {
        expect(() => mongoIo.getDatabase()).toThrow("Database not connected");
    });

    test('test getCollection', async () => {
        await expect(() => mongoIo.getCollection("foo")).rejects.toThrow("Database not connected");
    });

    test('test dropCollection', async () => {
        await expect(() => mongoIo.dropCollection("foo")).rejects.toThrow("Database not connected");
    });

    test('test setVersion', async () => {
        await expect(() => mongoIo.setVersion("foo", "")).rejects.toThrow("Database not connected");
    });

    test('test getVersion', async () => {
        await expect(() => mongoIo.getCollection("foo")).rejects.toThrow("Database not connected");
    });

    test('test applySchemaValidation', async () => {
        await expect(() => mongoIo.applySchemaValidation("foo", {})).rejects.toThrow("Database not connected");
    });

    test('test getSchemaValidation', async () => {
        await expect(() => mongoIo.getCollection("foo")).rejects.toThrow("Database not connected");
    });

    test('test clearSchemaValidation', async () => {
        await expect(() => mongoIo.clearSchemaValidation("foo")).rejects.toThrow("Database not connected");
    });

    test('test addIndexes', async () => {
        await expect(() => mongoIo.addIndexes("foo", [])).rejects.toThrow("Database not connected");
    });

    test('test getIndexes', async () => {
        await expect(() => mongoIo.getIndexes("foo")).rejects.toThrow("Database not connected");
    });

    test('test dropIndexes', async () => {
        await expect(() => mongoIo.dropIndexes("foo", [])).rejects.toThrow("Database not connected");
    });

    test('test executeAggregations', async () => {
        await expect(() => mongoIo.executeAggregations("foo", [])).rejects.toThrow("Database not connected");
    });
});