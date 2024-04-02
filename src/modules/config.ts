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
    private configFolder: string;
    private loadTestData: boolean;

    constructor() {
        this.configFolder = this.getConfigValue("CONFIG_FOLDER", "./config", false);
        this.loadTestData = this.getConfigValue("LOAD_TEST_DATA", "false", false) === "true";
        this.connectionString = this.getConfigValue("CONNECTION_STRING", "", true);
        this.dbName = this.getConfigValue("DB_NAME", "test", false);

        console.log(JSON.stringify(this.configItems)); // Simple logging
    }

    public async connect(): Promise<void> {
        this.client = new MongoClient(this.connectionString);
        await this.client.connect();
        this.db = this.client.db(this.dbName);
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
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

    public getConfigFolder(): string {
        return this.configFolder;
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
