/**
 * This set of unit tests test config init from env
 */
import { Config } from './Config';

describe('Config', () => {
    let config: Config;

    test('test default properties in getters', () => {
        config = new Config();
        expect(config.getConfigFolder()).toBe("/opt/mongoSchemaManager/configurations");
        expect(config.getMsmTypesFolder()).toBe("/opt/mongoSchemaManager/msmTypes");
        expect(config.shouldLoadTestData()).toBe(false);
    });

    test('test BUILT_AT', () => {
        testConfigDefaultValue("BUILT_AT","LOCAL");
    });

    test('test CONFIG_FOLDER', () => {
        testConfigDefaultValue("CONFIG_FOLDER","/opt/mongoSchemaManager/configurations");
    });

    test('test MSM_ROOT', () => {
        testConfigDefaultValue("MSM_ROOT","/opt/mongoSchemaManager");
    });

    test('test CONNECTION_STRING', () => {
        testConfigDefaultValue("CONNECTION_STRING","mongodb://root:example@localhost:27017");
    });

    test('test DB_NAME', () => {
        testConfigDefaultValue("DB_NAME","test");
    });

    test('test LOAD_TEST_DATA', () => {
        testConfigDefaultValue("LOAD_TEST_DATA","false");
    });
    
    function testConfigDefaultValue(configName: string, expectedValue: string) {
        config = new Config();

        const items = config.getConfigItems();

        const item = items.find(i => i.name === configName);
        expect(item).toBeDefined();
        if (item) {
            expect(item.name).toBe(configName);
            expect(item.from).toBe("default");
            expect(item.value).toBe(expectedValue);
        }
    }

});
