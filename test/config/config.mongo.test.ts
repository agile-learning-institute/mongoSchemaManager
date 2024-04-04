/**
 * NOTE: This set of unit tests requires a mongodb 
 * You can run a monog container with the following command
 * docker run -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=example --detach mongo:latest
 */
import { Config } from '../../src/config/Config';

describe('Config', () => {
    let config: Config;

    // Clear all mocks before each test
    beforeEach(() => {
        config = new Config();
    });

    test('test connect/disconnect', async () => {
        expect(() => config.getCollection("foo")).toThrow("Database not connected");

        await config.connect();
        let collection = config.getCollection("foo");
        expect(collection.collectionName).toBe("foo");

        await config.disconnect();
        expect(() => config.getCollection("foo")).toThrow("Database not connected");
    });

    test('test getDatabase', async () => {
        expect(() => config.getDatabase()).toThrow("Database not connected");

        await config.connect();
        let db = config.getDatabase();
        expect(db.databaseName).toBe("test");

        await config.disconnect();
        expect(() => config.getDatabase()).toThrow("Database not connected");
    });

    test('test getCollection', async () => {
        expect(() => config.getCollection("foo")).toThrow("Database not connected");

        await config.connect();
        let collection = config.getCollection("foo");
        expect(collection.collectionName).toBe("foo");

        await config.disconnect();
        expect(() => config.getCollection("foo")).toThrow("Database not connected");
    });

    test('test set/getVersion', async () => {
        // TODO
    });

    test('test apply/remove schema validation', async () => {
        // TODO
    });

    test('test add/drop indexes', async () => {
        // TODO
    });

    test('test aexecuteAggregations', async () => {
        // TODO
    });

    test('test bulkLoad', async () => {
        // TODO
    });
});