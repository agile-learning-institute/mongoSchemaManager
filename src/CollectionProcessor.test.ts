import { Config } from './Config/Config';
import { Collection } from '../src/Models/Collection';
import { CollectionProcessor } from '../src/CollectionProcessor';

jest.mock('../src/config/config', () => {
  return {
    Config: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      getCollectionFiles: jest.fn().mockReturnValue(['collection1.json', 'collection2.json']),
      getCollectionConfig: jest.fn().mockImplementation((fileName) => ({
        collectionName: fileName.split('.')[0], // Mocked implementation example
        versions: [], // Simplified mock data
      })),
    })),
  };
});

jest.mock('../src/models/collection', () => {
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
    expect(config.getCollectionConfig).toHaveBeenCalledTimes(2); // Assuming two files returned by getCollectionFiles
    expect(config.disconnect).toHaveBeenCalledTimes(1);

    expect(Collection).toHaveBeenCalledTimes(2);
  });

  // Add more tests here to cover different scenarios, such as error handling
});
