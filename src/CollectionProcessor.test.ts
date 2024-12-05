import { Config } from './config/Config';
import { Collection } from './models/Collection';
import { CollectionProcessor } from './CollectionProcessor';
import { FileIO } from './config/FileIO';
import { MongoIO } from './config/MongoIO';

jest.mock('./config/Config', () => {
  return {
    Config: jest.fn().mockImplementation(() => ({
      getMsmEnumerators: jest.fn()
    }))
  };
});

jest.mock('./config/MongoIO', () => {
  return {
    MongoIO: jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      getVersionData: jest.fn(),
      disconnect: jest.fn(),
      bulkLoad: jest.fn(),
      upsertEnumerators: jest.fn()
    }))
  };
});

jest.mock('./config/FileIO', () => {
  return {
    FileIO: jest.fn().mockImplementation(() => ({
      attachFiles: jest.fn(),
      getCollectionFiles: jest.fn().mockReturnValue(["one", "two"]),
      configureApp: jest.fn(),
      getCollectionConfig: jest.fn()
    }))
  };
});

const processVersionsMock = jest.fn().mockResolvedValue(undefined);
jest.mock('./models/Collection', () => {
  return {
    Collection: jest.fn().mockImplementation(() => ({
      processVersions: processVersionsMock
    })),
  };
});

describe('CollectionProcessor', () => {
  let config: jest.Mocked<Config>;
  let fileIO: jest.Mocked<FileIO>;
  let mongoIO: jest.Mocked<MongoIO>;
  let processor: CollectionProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    config = new Config() as jest.Mocked<Config>;
    fileIO = new FileIO(config) as jest.Mocked<FileIO>;
    mongoIO = new MongoIO(config) as jest.Mocked<MongoIO>;
    processor = new CollectionProcessor(config, fileIO, mongoIO);
  });

  it('should process collections correctly', async () => {
    await processor.processCollections();

    expect(mongoIO.connect).toHaveBeenCalledTimes(1);
    expect(fileIO.getCollectionFiles).toHaveBeenCalledTimes(1);
    expect(fileIO.getCollectionConfig).toHaveBeenCalledTimes(2);
    expect(processVersionsMock).toHaveBeenCalledTimes(2);
    expect(mongoIO.upsertEnumerators).toHaveBeenCalledTimes(1);
    expect(config.getMsmEnumerators).toHaveBeenCalledTimes(2);
    expect(mongoIO.getVersionData).toHaveBeenCalledTimes(1);
    expect(fileIO.configureApp).toHaveBeenCalledTimes(1);
    expect(mongoIO.disconnect).toHaveBeenCalledTimes(1);
    expect(fileIO.configureApp).toHaveBeenCalledTimes(1);

    expect(Collection).toHaveBeenCalledTimes(2);
  });

  it('should handle errors gracefully', async () => {
    let originalExit = process.exit;
    process.exit = jest.fn() as unknown as (code?: number) => never;
    processVersionsMock.mockRejectedValue(new Error("Error Thrown"));

    await processor.processCollections();
    expect(process.exit).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(mongoIO.disconnect).toHaveBeenCalled();
    process.exit = originalExit;
  });
});
