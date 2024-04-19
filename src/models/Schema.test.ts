import { Config } from '../config/Config';
import { FileIO } from '../config/FileIO';
import { Schema } from './Schema';
import { VersionNumber } from './VersionNumber';

// Mock the FileIO class
jest.mock('../../src/config/FileIO', () => ({
    FileIO: jest.fn().mockImplementation(() => ({
        getSchema: jest.fn(),
        getType: jest.fn(),
    })),
}));

// Mock the Config class
jest.mock('../../src/config/Config', () => ({
    Config: jest.fn().mockImplementation(() => ({
        getEnums: jest.fn()
    })),
}));

describe('Schema', () => {
    let configMock: jest.Mocked<Config>;
    let fileIoMock: jest.Mocked<FileIO>;
    const v1 = new VersionNumber("1.0.0.0");

    beforeEach(() => {
        jest.clearAllMocks();
        configMock = new Config() as jest.Mocked<Config>;
        fileIoMock = new FileIO(configMock) as jest.Mocked<FileIO>;
    });

    test('test msmType', () => {
        const schemaInput = { "bsonType": "object", "properties": { "name": { "description": "aDescription", "msmType": "msmWord" } } };
        const typeInput = { "bsonType": "string", "pattern": "foo" };
        const expectedOutput = { "bsonType": "object", "properties": { "name": { "description": "aDescription", "bsonType": "string", "pattern": "foo", } } };

        fileIoMock.getSchema.mockReturnValue(schemaInput);
        fileIoMock.getType.mockReturnValue(typeInput);

        let schemaLoader = new Schema(configMock, fileIoMock, "sample", v1);
        let theSchema = schemaLoader.getSchema();
        expect(theSchema).toStrictEqual(expectedOutput);
    });

    test('test msmType Recursive Object', () => {
        const schemaInput = { "bsonType": "object", "properties": { "name": { "description": "aDescription", "msmType": "fullName" } } };
        const fullNameType = { "bsonType": "object", "properties": { "firstName": { "description": "Thepersonsfirstname", "msmType": "msmWord" }, "lastName": { "description": "Thepersonslastname", "msmType": "msmWord" } }, "additionalProperties": false };
        const msmWordType = { "bsonType": "string", "pattern": "^[^\\s]{0,32}$" };
        const expectedOutput = { "bsonType": "object", "properties": { "name": { "description": "aDescription", "bsonType": "object", "properties": { "firstName": { "description": "Thepersonsfirstname", "bsonType": "string", "pattern": "^[^\\s]{0,32}$" }, "lastName": { "description": "Thepersonslastname", "bsonType": "string", "pattern": "^[^\\s]{0,32}$" } }, "additionalProperties": false } } };

        fileIoMock.getSchema.mockReturnValue(schemaInput);
        fileIoMock.getType.mockReturnValueOnce(fullNameType)
            .mockReturnValue(msmWordType);

        let schemaLoader = new Schema(configMock, fileIoMock, "people", v1);
        let theSchema = schemaLoader.getSchema();
        expect(theSchema).toStrictEqual(expectedOutput);
    });

    test('test msmType Recursive Array of msmType', () => {
        const schemaInput = { "bsonType": "object", "properties": { "paragraph": { "description": "aParagraphofText", "msmType": "msmParagraph" } } };
        const msmParagraphType = { "bsonType": "array", "items": { "description": "Sentences", "msmType": "msmSentence" } };
        const msmSentenceType = { "bsonType": "string", "pattern": ".*132" };
        const expectedOutput = { "bsonType": "object", "properties": { "paragraph": { "description": "aParagraphofText", "bsonType": "array", "items": { "description": "Sentences", "bsonType": "string", "pattern": ".*132" } } } };

        fileIoMock.getSchema.mockReturnValue(schemaInput);
        fileIoMock.getType.mockReturnValueOnce(msmParagraphType)
            .mockReturnValue(msmSentenceType);

        let schemaLoader = new Schema(configMock, fileIoMock, "people", v1);
        let theSchema = schemaLoader.getSchema();
        expect(theSchema).toStrictEqual(expectedOutput);
    });

    test('test msmType Recursive Array of Object', () => {
        const schemaInput = { "bsonTpyp": "object", "properties": { "list": { "bsonType": "array", "items": { "bsonType": "object", "properties": { "name": { "description": "TheName", "msmType": "msmWord" } } } } } };
        const msmWordType = { "bsonType": "string", "pattern": "^[^\\s]{0,32}$" };
        const expectedOutput = { "bsonTpyp": "object", "properties": { "list": { "bsonType": "array", "items": { "bsonType": "object", "properties": { "name": { "description": "TheName", "bsonType": "string", "pattern": "^[^\\s]{0,32}$" } } } } } };

        fileIoMock.getSchema.mockReturnValue(schemaInput);
        fileIoMock.getType.mockReturnValue(msmWordType)

        let schemaLoader = new Schema(configMock, fileIoMock, "people", v1);
        let theSchema = schemaLoader.getSchema();
        expect(theSchema).toStrictEqual(expectedOutput);
    });

    test('test msmEnums', () => {
        const schemaInput = { "bsonType": "object", "properties": { "status": { "description": "Thestatus", "msmEnums": "peopleStatus" }, } }
        const enums = { "one": "oneDescription", "two": "twoDescription" };
        const expectedOutput = { "bsonType": "object", "properties": { "status": { "description": "Thestatus", "bsonType": "string", "enum": ["one", "two"] } } };

        fileIoMock.getSchema.mockReturnValue(schemaInput);
        configMock.getEnums.mockReturnValue(enums);

        let schemaLoader = new Schema(configMock, fileIoMock, "people", v1);
        let theSchema = schemaLoader.getSchema();
        expect(theSchema).toStrictEqual(expectedOutput);
    });

    test('test msmEnumList', () => {
        const schemaInput = { "bsonType": "object", "properties": { "roles": { "description": "theroles", "msmEnumList": "roles" }, } }
        const enums = { "one": "oneDescription", "two": "twoDescription" };
        const expectedOutput = { "bsonType": "object", "properties": { "roles": { "description": "theroles", "bsonType": "array", "items": { "bsonType": "string", "enum": ["one", "two"] } } } };

        fileIoMock.getSchema.mockReturnValue(schemaInput);
        configMock.getEnums.mockReturnValue(enums);

        let schemaLoader = new Schema(configMock, fileIoMock, "people", v1);
        let theSchema = schemaLoader.getSchema();
        expect(theSchema).toStrictEqual(expectedOutput);
    });

    test('test msmEnum and msmEnumList in array of object', () => {
        const schemaInput = { "bsonType": "object", "properties": { "list": { "description": "A list for testing", "bsonType": "array", "items": { "bsonType": "object", "properties": { "type": { "description": "A type of list object", "msmEnums": "type" }, "tags": { "description": "A list of enumerated values", "msmEnumList": "tags" } } } } } };
        const enums = { "one": "oneDescription", "two": "twoDescription" };
        const expectedOutput = { "bsonType": "object", "properties": { "list": { "description": "A list for testing", "bsonType": "array", "items": { "bsonType": "object", "properties": { "type": { "description": "A type of list object", "bsonType": "string", "enum": ["one", "two"] }, "tags": { "description": "A list of enumerated values", "bsonType": "array", "items": { "bsonType": "string", "enum": ["one", "two"] } } } } } } };

        fileIoMock.getSchema.mockReturnValue(schemaInput);
        configMock.getEnums.mockReturnValue(enums);

        let schemaLoader = new Schema(configMock, fileIoMock, "people", v1);
        let theSchema = schemaLoader.getSchema();
        expect(theSchema).toStrictEqual(expectedOutput);
    });

    test('test aray of msmEnum', () => {
        const schemaInput = { "bsonType": "object", "properties": { "list": { "description": "A list for testing", "bsonType": "array", "items": { "msmEnums": "type" } } } };
        const enums = { "one": "oneDescription", "two": "twoDescription" };
        const expectedOutput = { "bsonType": "object", "properties": { "list": { "description": "A list for testing", "bsonType": "array", "items": { "bsonType": "string", "enum": ["one", "two"] } } } };

        fileIoMock.getSchema.mockReturnValue(schemaInput);
        configMock.getEnums.mockReturnValue(enums);

        let schemaLoader = new Schema(configMock, fileIoMock, "people", v1);
        let theSchema = schemaLoader.getSchema();
        expect(theSchema).toStrictEqual(expectedOutput);
    });

    test('test getSwagger basics', () => {
        const schemaInput = { "bsonType": "object", "description": "A test object", "properties": { "name": { "bsonType": "string" } } };
        const expectedOutput = { "openapi": "3.0.3", "info": { "title": "sample", "version": "1.0.0.0" }, "paths": { "/sample/": { "get": { "responses": { "200": { "description": "Success", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/sample" } } } } } } } }, "components": { "schemas": { "sample": { "description": "A test object", "type": "object", "properties": { "name": { "type": "string" } } } } } };

        fileIoMock.getSchema.mockReturnValue(schemaInput);

        let schemaLoader = new Schema(configMock, fileIoMock, "sample", v1);
        let theSwagger = schemaLoader.getSwagger();
        console.debug(theSwagger);
        expect(theSwagger).toStrictEqual(expectedOutput);
    });

    test('test getSwagger for msmEnum and msmEnumList in array of object', () => {
        const schemaInput = { "bsonType": "object", "properties": { "list": { "description": "A list for testing", "bsonType": "array", "items": { "bsonType": "object", "properties": { "type": { "description": "A type of list object", "msmEnums": "type" }, "tags": { "description": "A list of enumerated values", "msmEnumList": "tags" } } } } } };
        const enums = { "one": "oneDescription", "two": "twoDescription" };
        const expectedOutput = { "openapi": "3.0.3", "info": { "title": "sample", "version": "1.0.0.0" }, "paths": { "/sample/": { "get": { "responses": { "200": { "description": "Success", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/sample" } } } } } } } }, "components": { "schemas": { "sample": { "type": "object", "properties": { "list": { "description": "A list for testing", "type": "array", "items": { "type": "object", "properties": { "type": { "description": "A type of list object", "type": "string", "enum": ["one", "two"] }, "tags": { "description": "A list of enumerated values", "type": "array", "items": { "type": "string", "enum": ["one", "two"] } } } } } } } } } };

        fileIoMock.getSchema.mockReturnValue(schemaInput);
        configMock.getEnums.mockReturnValue(enums);

        let schemaLoader = new Schema(configMock, fileIoMock, "sample", v1);
        let theSwagger = schemaLoader.getSwagger();
        console.debug(theSwagger);
        expect(theSwagger).toStrictEqual(expectedOutput);
    });
});