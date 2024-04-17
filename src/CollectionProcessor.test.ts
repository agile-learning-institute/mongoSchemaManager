import { Config } from './config/Config';
import { Collection } from './models/Collection';
import { CollectionProcessor } from './CollectionProcessor';

jest.mock('./config/Config', () => {
  return {
    Config: jest.fn().mockImplementation(() => ({
      bulkLoad: jest.fn(),
      configureApp: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      setVersion: jest.fn(),
      loadEnumerators: jest.fn(),
      getEnumerators: jest.fn().mockReturnValue([]),
      getCollectionFiles: jest.fn().mockReturnValue(['collection1.json', 'collection2.json']),
      getCollectionConfig: jest.fn().mockImplementation((fileName) => ({
        collectionName: fileName.split('.')[0], // Mocked implementation example
        versions: [], // Simplified mock data
      })),
    })),
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
  let config: Config;
  let processor: CollectionProcessor;

  beforeEach(() => {
    jest.clearAllMocks();

    config = new Config();
    processor = new CollectionProcessor(config);
  });

  it('should process collections correctly', async () => {
    await processor.processCollections();

    expect(config.connect).toHaveBeenCalledTimes(1);
    expect(config.getCollectionFiles).toHaveBeenCalledTimes(1);
    expect(config.getCollectionConfig).toHaveBeenCalledTimes(2); 
    expect(config.disconnect).toHaveBeenCalledTimes(1);
    expect(config.loadEnumerators).toHaveBeenCalledTimes(1);
    expect(config.configureApp).toHaveBeenCalledTimes(1);

    expect(Collection).toHaveBeenCalledTimes(2);
  });

});
