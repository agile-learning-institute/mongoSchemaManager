import { Config } from '../config/Config'
import { FileIO } from '../config/FileIO';
import { MongoIO } from '../config/MongoIO';
import { Collection } from './Collection';
import { VersionNumber } from './VersionNumber';

jest.mock('../config/Config', () => {
    return {
        Config: jest.fn().mockImplementation(() => ({}))
    };
});

jest.mock('../config/MongoIO', () => {
    return {
        MongoIO: jest.fn().mockImplementation(() => ({
            getVersion: jest.fn().mockReturnValue("1.0.0.0")
        }))
    };
});

jest.mock('../config/FileIO', () => {
    return {
        FileIO: jest.fn().mockImplementation(() => ({}))
    };
});

// Mock the Version class
jest.mock("./Version", () => {
    return {
        Version: jest.fn().mockImplementation(() => {
            return {
                getVersion: jest.fn().mockReturnValue(new VersionNumber("1.0.0.0")),
                apply: jest.fn()
            };
        })
    };
});

describe('Collection', () => {
    let config: jest.Mocked<Config>;
    let fileIO: jest.Mocked<FileIO>;
    let mongoIO: jest.Mocked<MongoIO>;
    const expectedVersion = new VersionNumber("1.0.0.0");

    beforeEach(() => {
        jest.clearAllMocks();
        config = new Config() as jest.Mocked<Config>;
        fileIO = new FileIO(config) as jest.Mocked<FileIO>;
        mongoIO = new MongoIO(config) as jest.Mocked<MongoIO>;
    });

    test('test constructor', () => {
        process.env.CONFIG_FOLDER = "./test/resources";
        const config = new Config();
        const collectionConfig = {
            "name": "foo",
            "versions": [{ "version": "1.0.0" }]
        };
        const theCollection = new Collection(config, mongoIO, fileIO, collectionConfig);

        expect(theCollection.getName()).toBe("foo");
        expect(theCollection.getVersions().length).toBe(1);
        expect(theCollection.getVersions()[0].getVersion()).toStrictEqual(expectedVersion);
    });

    test('test process', async () => {
        const config = new Config();
        const collectionConfig = {
            name: "testCollection",
            versions: [{ version: "1.0.0.0" }]
        };

        const collection = new Collection(config, mongoIO, fileIO, collectionConfig);
        expect(collection.getCurrentVersion()).toBe("");
        await collection.processVersions();
        expect(collection.getCurrentVersion()).toBe("1.0.0.0");
        expect(mongoIO.getVersion).toHaveBeenCalledTimes(1);
    });

});