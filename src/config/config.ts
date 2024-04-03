import { MongoClient, Db } from 'mongodb';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ConfigItem {
    name: string;
    value: string;
    from: string;
}

export class Config {
    private configItems: ConfigItem[] = []; 
    private connectionString: string;
    private dbName: string;
    private client?: MongoClient;
    private db?: Db;
    private configFolder: string = "";
    private msmTypesFolder: string;
    private loadTestData: boolean;
    private enumerators: any;

    constructor() {
        this.configFolder = this.getConfigValue("CONFIG_FOLDER", "/opt/mongoSchemaManager/config", false);
        this.msmTypesFolder = this.getConfigValue("MSM_TYPES", "/opt/mongoSchemaManager/msmTypes", false);
        this.connectionString = this.getConfigValue("CONNECTION_STRING", "mongodb://root:example@localhost:27017", true);
        this.dbName = this.getConfigValue("DB_NAME", "test", false);
        this.loadTestData = this.getConfigValue("LOAD_TEST_DATA", "false", false) === "true";

        if (existsSync(this.getEnumeratorsFileName())) {
            this.enumerators = JSON.parse(readFileSync(this.getEnumeratorsFileName(), 'utf-8'))[0];
        } else {
            this.enumerators = {};
        }

        console.log(JSON.stringify(this.configItems)); // Simple logging
    }

    public async connect(): Promise<void> {
        this.client = new MongoClient(this.connectionString);
        await this.client.connect();
        this.db = this.client.db(this.dbName);

        // load enumerators from mongodb enumerators collection.
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = undefined;
            this.db = undefined;
        }
    }

    public getCollection(collectionName: string) {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        return this.db.collection(collectionName);
    }

    public getDatabase(): Db {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        return this.db;
    }

    public getEnumerators(): any {
        return this.enumerators;
    }

    public getEnumeratorsFileName(): any {
        return this.configFolder + "/enumerators/enumerators.json";
    }

    public getCollectionsFolder(): string {
        return this.configFolder + "/collections";
    }

    public getCustomTypesFolder(): string {
        return this.configFolder + "/customTypes";
    }

    public getSchemasFolder(): string {
        return this.configFolder + "/schemas";
    }

    public getTestDataFolder(): string {
        return this.configFolder + "/testData";
    }

    public getMsmTypesFolder(): string {
        return this.msmTypesFolder;
    }

    public shouldLoadTestData(): boolean {
        return this.loadTestData;
    }

    private getConfigValue(name: string, defaultValue: string, isSecret: boolean): string {
        let value = process.env[name] || defaultValue;
        let from = 'default';

        if (process.env[name]) {
            from = 'environment';
        } else {
            const filePath = join(this.configFolder, name);
            if (existsSync(filePath)) {
                value = readFileSync(filePath, 'utf-8');
                from = 'file';
            }
        }

        this.configItems.push({ name, value, from });
        return value;
    }
}
