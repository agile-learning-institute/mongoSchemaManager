/**
 * This set of unit tests test config init from env
 */
import { Config } from './Config';
import { VersionNumber } from '../models/VersionNumber';

describe('Config', () => {
    let config: Config;

    test('test CONFIG_FOLDER', () => {
        testConfigEnvironmentValue("CONFIG_FOLDER");
    });

    test('test MSM_ROOT', () => {
        testConfigEnvironmentValue("MSM_ROOT");
    });

    test('test CONNECTION_STRING', () => {
        testConfigEnvironmentValue("CONNECTION_STRING");
    });

    test('test DB_NAME', () => {
        testConfigEnvironmentValue("DB_NAME");
    });

    test('test LOAD_TEST_DATA', () => {
        testConfigEnvironmentValue("LOAD_TEST_DATA");
        expect(config.shouldLoadTestData()).toBe(false);
    });
    
    test('test shouldLoadTestData', () => {
        process.env.LOAD_TEST_DATA = "false";
        config = new Config();
        process.env.LOAD_TEST_DATA = "";
        expect(config.shouldLoadTestData()).toBe(false);

        process.env.LOAD_TEST_DATA = "true";
        config = new Config();
        process.env.LOAD_TEST_DATA = "";
        expect(config.shouldLoadTestData()).toBe(true);
    });
    
    function testConfigEnvironmentValue(configName: string) {
        process.env[configName] = "ENVIRONMENT";
        config = new Config();
        process.env[configName] = "";

        const items = config.getConfigItems();

        const item = items.find(i => i.name === configName);
        expect(item).toBeDefined();
        if (item) {
            expect(item.name).toBe(configName);
            expect(item.from).toBe("environment");
            expect(item.value).toBe("ENVIRONMENT");
        }
    }

});
