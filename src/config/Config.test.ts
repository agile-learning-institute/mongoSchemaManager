import { Config } from './Config';

describe('Config', () => {
    let config: Config;

    // Clear all mocks before each test
    beforeEach(() => {
        config = new Config();
    });

    test('test getEnums', () => {
        config.setEnumerators([{"name":"Enumerations","status":"Active","version":0,"enumerators":{"foo":{"bar":"Bar Test","bat":"Bat Test"}}}]);
        const enums = config.getEnums(0, "foo");
        expect(enums).toStrictEqual({"bar":"Bar Test","bat":"Bat Test"});
    });    
});
