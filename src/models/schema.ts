import { readFileSync, existsSync } from "fs";
import { join } from "path";

export class Schema {
    private schema: any;

    constructor(filename: string, private basePath: string = "./") {
        const schemaContent = readFileSync(filename, 'utf8');
        this.schema = JSON.parse(schemaContent);
        this.schema = this.preProcessMsmType(this.schema); // Process the entire schema recursively
        this.preProcessMsmEnums();
        this.preProcessMsmEnumList();
    }

    public getSchema(): any {
        return this.schema;
    }

    private preProcessMsmType(property: any): any {
        if (property.hasOwnProperty('msmType')) {
            const typeFilename = join(this.basePath, "types", `${property.msmType}.json`);
            if (existsSync(typeFilename)) {
                const typeContent = readFileSync(typeFilename, 'utf8');
                const typeDefinition = JSON.parse(typeContent);
                delete property.msmType; // Remove the msmType property
                return Object.assign({}, property, this.preProcessMsmType(typeDefinition)); // Merge and recursively process
            } else {
                console.warn(`Type definition file for ${property.msmType} not found.`);
            }
        } else if (property.type === 'object' && property.properties) {
            Object.keys(property.properties).forEach(key => {
                property.properties[key] = this.preProcessMsmType(property.properties[key]);
            });
        } else if (property.type === 'array' && property.items) {
            property.items = this.preProcessMsmType(property.items);
        }
        return property;
    }

    private preProcessMsmEnums(): void {
        Object.keys(this.schema.properties).forEach(key => {
            const property = this.schema.properties[key];
            if (property.hasOwnProperty('msmEnums')) {
                const enumName = property.msmEnums;
                const enumValues = this.enumsConfig[enumName];
                if (enumValues) {
                    delete property.msmEnums; // Remove the msmEnums property
                    property.bsonType = "string"; // Set the type to string for enums
                    property.enum = Object.keys(enumValues); // Set enum keys as possible values
                } else {
                    console.warn(`Enum definition for ${enumName} not found.`);
                }
            }
        });
    }

    private preProcessMsmEnumList(): void {
        Object.keys(this.schema.properties).forEach(key => {
            const property = this.schema.properties[key];
            if (property.hasOwnProperty('msmEnumList')) {
                const enumName = property.msmEnumList;
                const enumValues = this.enumsConfig[enumName];
                if (enumValues) {
                    delete property.msmEnumList; // It seems you want to keep it, but here it's removed after processing
                    property.bsonType = "array";
                    property.items = {
                        bsonType: "string",
                        enum: Object.keys(enumValues)
                    };
                } else {
                    console.warn(`Enum list definition for ${enumName} not found.`);
                }
            }
        });
    }
}
