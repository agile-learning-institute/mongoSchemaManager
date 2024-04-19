import { Config } from './Config';
import { MongoIO } from './MongoIO';
import { EJSON } from 'bson';


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
        await expect(() => mongoIo.getVersion("foo")).rejects.toThrow("Database not connected");
    });

    test('test getVersionData', async () => {
        await expect(() => mongoIo.getVersionData()).rejects.toThrow("Database not connected");
    });

    test('test getVersionData', async () => {
        await expect(() => mongoIo.getVersionData()).rejects.toThrow("Database not connected");
    });

    test('test applySchemaValidation', async () => {
        await expect(() => mongoIo.applySchemaValidation("foo", {})).rejects.toThrow("Database not connected");
    });

    test('test getSchemaValidation', async () => {
        await expect(() => mongoIo.getSchemaValidation("foo")).rejects.toThrow("Database not connected");
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

    test('test bulkLoad', async () => {
        await expect(() => mongoIo.bulkLoad("foo", [])).rejects.toThrow("Database not connected");
    });

    test('test applySchemaValidationFail', async () => {
        const testSchema = { "foo": "bar" };
        await mongoIo.connect();
        await expect(() => mongoIo.applySchemaValidation("test", testSchema)).rejects.toThrow("Parsing of collection validator failed");
        await mongoIo.dropCollection("test");
        await mongoIo.disconnect();
    });

    test('test addIndexsNone', async () => {
        await mongoIo.connect();
        expect(await mongoIo.addIndexes("test", [])).resolves;
        await mongoIo.dropCollection("test");
        await mongoIo.disconnect();
    });

    test('test addIndexsInvalidFail', async () => {
        const indexs = [{"name":"nameIndex","key":"InvalidKey"}];
        await mongoIo.connect();
        await mongoIo.dropCollection("test");
        await mongoIo.getCollection("test");
        await expect(() => mongoIo.addIndexes("test", indexs)).rejects.toThrow("Error in specification");
        await mongoIo.dropCollection("test");
        await mongoIo.disconnect();
    });

    test('test dropIndexesEmptyFail', async () => {
        await mongoIo.connect();
        await mongoIo.getCollection("test");
        expect(mongoIo.dropIndexes("test", [])).resolves;
        await mongoIo.dropCollection("test");
        await mongoIo.disconnect();
    });

    test('test bulkLoadFial', async () => {
        const data = ["foo"];
        await mongoIo.connect();
        await expect(() => mongoIo.bulkLoad("test", data)).rejects.toThrow("Cannot create property");
        await mongoIo.dropCollection("test");
        await mongoIo.disconnect();
    });
});