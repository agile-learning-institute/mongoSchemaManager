import { existsSync, readFileSync } from "fs";
import { join } from 'path';

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

    public getMsmEnumerators(): any {
        return this.enumerators;
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
}
