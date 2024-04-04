import { Config } from '../../src/config/Config';

describe('Config', () => {
    let config: Config;

    beforeEach(async () => {
        config = new Config();
    });

    test('test connect/disconnect', async () => {
        expect(() => config.getCollection("foo")).toThrow("Database not connected");
    });

    test('test getDatabase', async () => {
        expect(() => config.getDatabase()).toThrow("Database not connected");
    });

    test('test getCollection', async () => {
        expect(() => config.getCollection("foo")).toThrow("Database not connected");
    });
});