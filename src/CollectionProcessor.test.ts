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
      bulkLoad: jest.fn()
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

jest.mock('./models/Collection', () => {
  return {
    Collection: jest.fn().mockImplementation(() => ({
      processVersions: jest.fn().mockResolvedValue(undefined),
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
    expect(mongoIO.disconnect).toHaveBeenCalledTimes(1);
    expect(fileIO.configureApp).toHaveBeenCalledTimes(1);

    expect(Collection).toHaveBeenCalledTimes(2);
  });

});
