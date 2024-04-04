import { Config } from '../../src/config/config';
import { Schema } from '../../src/models/schema';

describe('Schema', () => {

    test('test msmTypes', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        let config = new Config();
        let schemaLoader = new Schema(config, "people", "1.0.0");
        let schema = schemaLoader.getSchema();
        expect(schema["properties"]["name"]["description"]).toBe("VERSION document only");
        expect(schema["properties"]["name"]["msmType"]).toBe(undefined);
        expect(schema["properties"]["name"]["bsonType"]).toBe("string");
        expect(schema["properties"]["name"]["pattern"]).toBe("^[^\\s]{0,32}$");
    });

    test('test msmEnum', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        let config = new Config();
        let schemaLoader = new Schema(config, "people", "2.0.0");
        let schema = schemaLoader.getSchema();
        expect(schema["properties"]["status"]["description"]).toBe("The status of this member");
        expect(schema["properties"]["status"]["msmEnums"]).toBe(undefined);
        expect(schema["properties"]["status"]["bsonType"]).toBe("string");
        expect(schema["properties"]["status"]["enum"]).toBeInstanceOf(Array);
    });

    test('get msmEnumList', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        let config = new Config();
        let schemaLoader = new Schema(config, "people", "2.0.0");
        let schema = schemaLoader.getSchema();
        expect(schema["properties"]["roles"]["description"]).toBe("RBAC Roles for this person");
        expect(schema["properties"]["roles"]["bsonType"]).toBe("array");
        expect(schema["properties"]["roles"]["items"]["bsonType"]).toBe("string");
        expect(schema["properties"]["roles"]["items"]["enum"]).toBeInstanceOf(Array);
    });
});