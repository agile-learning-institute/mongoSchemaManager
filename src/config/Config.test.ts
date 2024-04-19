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

    test('test getEnums error', () => {
        config.setEnumerators([{"name":"Enumerations","status":"Active","version":0,"enumerators":{"foo":{"bar":"Bar Test","bat":"Bat Test"}}}]);
        expect(() => config.getEnums(0, "bad")).toThrow("Enumerator does not exist:bad");
    });    

    test('test getEnumerators', () => {
        const testData = [{"name":"Enumerations","status":"Active","version":0,"enumerators":{"foo":{"bar":"Bar Test","bat":"Bat Test"}}}];
        config.setEnumerators(testData);
        const result = config.getMsmEnumerators();
        expect(result).toStrictEqual(testData);
    });    

});
