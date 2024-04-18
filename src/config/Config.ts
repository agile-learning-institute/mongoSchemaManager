import { existsSync, readFileSync } from "fs";
import { join } from 'path';
import { ConfigFile } from './ConfigFile';
import { ConfigMongo } from "./ConfigMongo";
import { VersionNumber } from "../models/VersionNumber";
import { Db } from "mongodb";
import { Index } from "../models/Index";

/**
 * A config item, used to track where configuration values were found
 */
interface ConfigItem {
    name: string;
    value: string;
    from: string;
}

/**
 * Class Config: This class manages configuration values 
 *      from the enviornment or configuration files, 
 *      and abstracts all file and mongodb i-o.
 */
export class Config {
    private configItems: ConfigItem[] = []; // Configuration Items 
    private configFolder: string = "";      // Where input configurations are found
    private connectionString: string;       // Database Connection String
    private dbName: string;                 // Database Name
    private msmRootFolder: string;          // Where system resources (/apps & /msmTypes) are found 
    private loadTestData: boolean;          // Load test data flag
    private enumerators: any;               // System enumerators
    private fileIo: ConfigFile              // File IO Handlers
    private mongoIo: ConfigMongo            // MongoDB IO Handlers

    /**
     * Constructor gets configuration values, loads the enumerators, and logs completion
     */
    constructor() {
        this.getConfigValue("BUILT_AT", "LOCAL", false);
        this.configFolder = this.getConfigValue("CONFIG_FOLDER", "/opt/mongoSchemaManager/configurations", false);
        this.msmRootFolder = this.getConfigValue("MSM_ROOT", "/opt/mongoSchemaManager", false);
        this.connectionString = this.getConfigValue("CONNECTION_STRING", "mongodb://root:example@localhost:27017", true);
        this.dbName = this.getConfigValue("DB_NAME", "test", false);
        this.loadTestData = this.getConfigValue("LOAD_TEST_DATA", "false", false) === "true";
        this.fileIo = new ConfigFile(this);
        this.mongoIo = new ConfigMongo(this);

        console.info("Configuration Initilized:", JSON.stringify(this.configItems));
    }

    /**
     * Get the named configuration value, from the environment if available, 
     * then from a file if present, and finally use the provided default if not 
     * found. This will add a ConfigItem that describes where this data was found
     * to the configItems array. Secret values are not recorded in the configItem.
     * 
     * @param name 
     * @param defaultValue 
     * @param isSecret 
     * @returns the value that was found.
     */
    private getConfigValue(name: string, defaultValue: string, isSecret: boolean): string {
        let value = process.env[name] || defaultValue;
        let from = 'default';

        if (process.env[name]) {
            from = 'environment';
        } else {
            const filePath = join(this.configFolder, name);
            if (existsSync(filePath)) {
                value = readFileSync(filePath, 'utf-8').trim();
                from = 'file';
            }
        }

        this.configItems.push({ name, value, from });
        return value;
    }

    /**
     * Get the named enumerators object from the enumerators version specified
     * 
     * @param version 
     * @param name 
     * @returns enumerators object {"Value":"Description"}
     */
    public getEnums(version: number, name: string): any {
        if (this.enumerators[version].version != version) {
            throw new Error("Invalid Enumerators File bad version number sequence")
        }
        if (this.enumerators[version].enumerators.hasOwnProperty(name)) {
            return this.enumerators[version].enumerators[name];
        } else {
            throw new Error("Enumerator does not exist:" + name);
        }
    }

    /**
     * Simple Setters
     */
    public setEnumerators(enums: any) {
        this.enumerators = enums;
    }

    /** 
     * Simple Getters
     */
    public file(): ConfigFile {
        return this.fileIo;
    }

    public mongo(): ConfigMongo {
        return this.mongoIo;
    }

    public shouldLoadTestData(): boolean {
        return this.loadTestData;
    }

    public getConfigItems(): ConfigItem[] {
        return this.configItems;
    }

    public getMsmRootFolder(): string {
        return this.msmRootFolder;
    }

    public getConfigFolder(): string {
        return this.configFolder;
    }

    public getCollectionsFolder() {
        return join(this.configFolder, "collections");
    }    

    public getMsmTypesFolder(): string {
        return join(this.msmRootFolder, "msmTypes");
    }

    public getCustomTypesFolder(): string {
        return join(this.configFolder, "customTypes");
    }

    public getMsmEnumeratorsFolder(): string {
        return join(this.configFolder, "enumerators");
    }

    public getMsmEnumeratorsFile(): string {
        return join(this.getMsmEnumeratorsFolder(), "enumerators.json");
    }

    public getOpenApiFolder(): string {
        return join(this.configFolder, "openApi");
    }    

    public getSchemasFolder(): string {
        return join(this.configFolder, "schemas")
    }

    public getTestDataFolder(): string {
        return join(this.configFolder, "testData");
    }

    public getConnectionString(): string {
        return this.connectionString;
    }

    public getDbName(): string {
        return this.dbName
    }

    /**
     * File I-O Facade Functions
     */
    public async loadEnumerators() {
        this.mongoIo.bulkLoad("enumerators", this.fileIo.readEnumeratorsFile());
    }

    public attachFiles() {
        return this.fileIo.attachFiles();
    }

    public async configureApp() {
        return this.fileIo.configureApp(this.mongoIo.getVersionData());
    }

    public getCollectionConfig(fileName: string): any {
        return this.fileIo.getCollectionConfig(fileName);
    }

    public getCollectionFiles(): string[] {
        return this.fileIo.getCollectionFiles();
    }

    public getSchema(collection: string, version: VersionNumber): any {
        return this.fileIo.getSchema(collection, version);
    }

    public getTestData(filename: string): any {
        return this.fileIo.getTestData(filename);
    }

    public getType(type: string): any {
        return this.fileIo.getType(type);
    }

    public saveSwagger(collection: string, version: VersionNumber, swagger: any) {
        return this.fileIo.saveSwagger(collection, version, swagger);
    }

    /**
     * Mongo I-O Facade Functions
     */
    public async connect(): Promise<void> {
        return this.mongoIo.connect();
    }

    public async disconnect(): Promise<void> {
        return this.mongoIo.disconnect();
    }

    public getDatabase(): Db {
        return this.mongoIo.getDatabase();
    }

    public async getCollection(collectionName: string) {
        return this.mongoIo.getCollection(collectionName);
    }

    public async dropCollection(collectionName: string) {
        return this.mongoIo.dropCollection(collectionName);
    }

    public async getVersion(collectionName: string): Promise<string> {
        return this.mongoIo.getVersion(collectionName);
    }

    public async getVersionData(): Promise<any> {
        return this.mongoIo.getVersionData();
    }
    
    public async setVersion(collectionName: string, versionString: string) {
        return this.mongoIo.setVersion(collectionName,versionString);
    }

    public async applySchemaValidation(collectionName: string, schema: any) {
        return this.mongoIo.applySchemaValidation(collectionName, schema);
    }

    public async getSchemaValidation(collectionName: string): Promise<any> {
        return this.mongoIo.getSchemaValidation(collectionName);
    }

    public async clearSchemaValidation(collectionName: string) {
        return this.mongoIo.clearSchemaValidation(collectionName);
    }

    public async addIndexes(collectionName: string, indexes: any[]) {
        return this.mongoIo.addIndexes(collectionName, indexes);
    }

    public async getIndexes(collectionName: string): Promise<Index[]> {
        return this.mongoIo.getIndexes(collectionName);
    }

    public async dropIndexes(collectionName: string, names: string[]) {
        return this.mongoIo.dropIndexes(collectionName, names);
    }

    public async executeAggregations(collectionName: string, aggregations: any[][]) {
        return this.mongoIo.executeAggregations(collectionName,aggregations);
    }

    public async bulkLoad(collectionName: string, data: any[]) {
        return this.mongoIo.bulkLoad(collectionName, data);
    }
}
