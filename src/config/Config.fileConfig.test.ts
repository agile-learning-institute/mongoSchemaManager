/**
 * This set of unit tests test config init from files
 * and uses the files in /test/configTest
 */
import { Config } from './Config';

describe('Config', () => {
    let config: Config;

    // Clear all mocks before each test
    beforeEach(() => {
        process.env.CONFIG_FOLDER = "./test/configTest";
        config = new Config();
    });

    test('test MSM_ROOT', () => {
        testConfigFileValue("MSM_ROOT");
    });

    test('test CONNECTION_STRING', () => {
        testConfigFileValue("CONNECTION_STRING");
    });

    test('test DB_NAME', () => {
        testConfigFileValue("DB_NAME");
    });

    test('test LOAD_TEST_DATA', () => {
        testConfigFileValue("LOAD_TEST_DATA");
    });
    
    function testConfigFileValue(configName: string) {
        const items = config.getConfigItems();

        const item = items.find(i => i.name === configName);
        expect(item).toBeDefined();
        if (item) {
            expect(item.name).toBe(configName);
            expect(item.from).toBe("file");
            expect(item.value).toBe("TEST_VALUE");
        }
    }
});
