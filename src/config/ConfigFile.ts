import { VersionNumber } from '../models/VersionNumber';
import { writeFileSync, readdirSync, mkdirSync, existsSync, copyFileSync, readFileSync, statSync } from "fs";
import { join } from 'path';
import * as yaml from 'js-yaml';
import { Config } from './Config';

/**
 * Class Config File: abstracts all file I-O
 */
export class ConfigFile {
    private config: Config;

    /**
     * Constructor gets configuration values, loads the enumerators, and logs completion
     */
    constructor(config: Config) {
        this.config = config;
    }

    /**
     * Initilize file system access, validate config folders exist.
     */
    public attachFiles() {
        this.checkFolders();
        this.config.setEnumerators(this.readEnumeratorsFile());
    }

    /**
    * Check to make sure configuration folders exist, creating folders that are mssing, or throwing
    * an error if missing folders can not be empty.
    */
    private checkFolders() {
        assertFolderExists(this.config.getMsmRootFolder(), false);
        assertFolderExists(this.config.getCollectionsFolder(), false);
        assertFolderExists(this.config.getMsmEnumeratorsFolder(), false);
        assertFolderExists(this.config.getSchemasFolder(), false);

        assertFolderExists(this.config.getMsmTypesFolder(), true);
        assertFolderExists(this.config.getOpenApiFolder(), true);
        assertFolderExists(this.config.getTestDataFolder(), true);


        if (!existsSync(this.config.getMsmEnumeratorsFile())) {
            throw new Error("Enumerations File does not exist! " + this.config.getMsmEnumeratorsFile());
        }

        function assertFolderExists(folderName: string, createIt: boolean) {
            if (!(existsSync(folderName) && statSync(folderName).isDirectory())) {
                if (createIt) {
                    mkdirSync(folderName);
                    console.info(folderName, "Created");
                } else {
                    throw new Error("Folder does not exist! " + folderName);
                }
            }
        }
    }

    /**
     * Configure the swagger viewer app
     * - Copy this.msmRootFolder + /app to this.getOpenApiFolder
     * - Write all documents from msmVersions folder to versions.json
     */
    public async configureApp(versions: any) {
        const appFile = join(this.config.getMsmRootFolder(), "app", "index.html");
        const targetFile = join(this.config.getOpenApiFolder(), "index.html");
        copyFileSync(appFile, targetFile);

        const versionsFile = join(this.config.getOpenApiFolder(), "versions.json");
        writeFileSync(versionsFile, JSON.stringify(versions), 'utf8');
    }

    /**
     * Read the specified collection configuration file 
     * 
     * @param fileName 
     * @returns JSON Collection object
     */
    public getCollectionConfig(fileName: string): any {
        const filePath = join(this.config.getCollectionsFolder(), fileName);
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    }

    /**
     * Get the collection configuration files from the collections folder
     * 
     * @returns array of file names
     */
    public getCollectionFiles(): string[] {
        const collectionsFolder = this.config.getCollectionsFolder();
        const collectionFiles = readdirSync(collectionsFolder).filter(file => file.endsWith('.json'));
        if (!Array.isArray(collectionFiles)) {
            return [];
        }
        return collectionFiles;
    }

    /**
     * Read the collection schema file specified at the version provided
     * 
     * @param collection 
     * @param version 
     * @returns a schema object (NOT pre-processed)
     */
    public getSchema(collection: string, version: VersionNumber): any {
        const schemaFileName = join(this.config.getSchemasFolder(), collection + "-" + version.getShortVersionString() + ".json");
        return JSON.parse(readFileSync(schemaFileName, 'utf8'));
    }

    /**
     * Read the test data file specified
     * 
     * @param filename 
     * @returns JSON parsed object from the file
     */
    public getTestData(filename: string): any {
        let filePath = join(this.config.getTestDataFolder(), filename + ".json");
        return JSON.parse(readFileSync(filePath, 'utf8'));
    }

    /**
     * Get a custom type, looking first in the msmTypesFolder and if not
     * found there look in the <root>/customTypes folder.
     * 
     * @param type - the name of the type file (without a json extension)
     * @returns The parsed JSON object from the type file
     */
    public getType(type: string): any {
        let typeFilename: string;
        typeFilename = join(this.config.getCustomTypesFolder(), type + ".json");
        if (!existsSync(typeFilename)) {
            typeFilename = join(this.config.getMsmTypesFolder(), type + ".json")
            if (!existsSync(typeFilename)) {
                throw new Error("Type Not Found:" + typeFilename);
            }
        }
        const typeContent = readFileSync(typeFilename, 'utf-8');
        return JSON.parse(typeContent);
    }

    /**
    * Read the Enumerations
    * @returns JSON parsed Enumerators
    */
    public readEnumeratorsFile(): any {
        let enumeratorsFileName = this.config.getMsmEnumeratorsFile();
        return JSON.parse(readFileSync(enumeratorsFileName, 'utf-8'));
    }

    /**
     * Save swagger
     * 
     * @param collection 
     * @param version 
     * @returns a schema object (NOT pre-processed)
     */
    public saveSwagger(collection: string, version: VersionNumber, swagger: any) {
        const swaggerFilename = join(this.config.getOpenApiFolder(), collection + "-" + version.getVersionString() + ".openapi.yaml");
        writeFileSync(swaggerFilename, yaml.dump(swagger), 'utf8');
    }
}
