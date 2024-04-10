import { Config } from '../../src/config/Config';
import { Schema } from '../../src/models/Schema';
import { VersionNumber } from '../../src/models/VersionNumber';

// Mock the Config class
jest.mock('../../src/config/Config', () => ({
    Config: jest.fn().mockImplementation(() => ({
        getSchema: jest.fn(),
        getType: jest.fn(),
        getEnums: jest.fn(),
    })),
}));

describe('Schema', () => {
    let configMock: jest.Mocked<Config>; 
    const v1 = new VersionNumber("1.0.0.0");

    beforeEach(() => {
        jest.clearAllMocks();
        configMock = new Config() as jest.Mocked<Config>;;
    });

    test('test msmType', () => {
        const schemaInput = {
            "bsonType": "object",
            "properties": {
                "name": {
                    "description": "aDescription",
                    "msmType": "msmWord"
                }
            }
        }
        const typeInput = {
            "bsonType": "string",
            "pattern": "foo"
        };
        const expectedOutput = {
            "bsonType": "object",
            "properties": {
                "name": {
                    "description": "aDescription",
                    "bsonType": "string",
                    "pattern": "foo",
                }
            }
        };

        configMock.getSchema.mockReturnValue(schemaInput);
        configMock.getType.mockReturnValue(typeInput);

        let schemaLoader = new Schema(configMock, "people", v1);
        let theSchema = schemaLoader.getSchema();
        expect(theSchema).toStrictEqual(expectedOutput);
    });

    test('test msmEnums', () => {
        const schemaInput = {
            "bsonType": "object",
            "properties": {
                "status": {
                    "description": "The status",
                    "msmEnums": "peopleStatus"
                },
            }
        }
        const enums = {
            "one": "oneDescription",
            "two": "twoDescription"
        };
        const expectedOutput = {
            "bsonType": "object",
            "properties": {
                "status": {
                    "description": "The status",
                    "bsonType": "string",
                    "enum": [
                        "one",
                        "two"
                    ]
                }
            }
        };

        configMock.getSchema.mockReturnValue(schemaInput);
        configMock.getEnums.mockReturnValue(enums);

        let schemaLoader = new Schema(configMock, "people", v1);
        let theSchema = schemaLoader.getSchema();
        expect(theSchema).toStrictEqual(expectedOutput);
    });

    test('test msmEnumList', () => {
        const schemaInput = {
            "bsonType": "object",
            "properties": {
                "roles": {
                    "description": "the roles",
                    "msmEnumList": "roles"
                },
            }
        }
        const enums = {
            "one": "oneDescription",
            "two": "twoDescription"
        };
        const expectedOutput = {
            "bsonType": "object",
            "properties": {
                "roles": {
                    "description": "the roles",
                    "bsonType": "array",
                    "items": {
                        "bsonType": "string",
                        "enum": [
                            "one",
                            "two"
                        ]
                    }
                }
            }
        };

        configMock.getSchema.mockReturnValue(schemaInput);
        configMock.getEnums.mockReturnValue(enums);

        let schemaLoader = new Schema(configMock, "people", v1);
        let theSchema = schemaLoader.getSchema();
        expect(theSchema).toStrictEqual(expectedOutput);
    });
});