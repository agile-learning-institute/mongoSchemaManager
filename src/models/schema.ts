import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { Config } from "../config/config";

/**
 * This class is responsible for reading and pre-processing schema files
 */
export class Schema {
    private schema: any;
    private config: Config;

    constructor(config: Config, collection: string, version: string) {
        const schemaFileName = config.getSchemasFile(collection, version);
        this.config = config;
        this.schema = JSON.parse(readFileSync(schemaFileName, 'utf8'));
        this.schema.properties = this.preProcessMsmType(this.schema.properties); // Process the entire schema recursively
        this.preProcessMsmEnums();
        this.preProcessMsmEnumList();

        console.log("INFO", "Schema For Collection:" + collection, "Version:" + version, "Schema:" + JSON.stringify(this.schema)); 
    }

    public getSchema(): any {
        return this.schema;
    }
    /**
     * This function recursively implements custom types that are 
     * identified with an msmType property. msmType is replaced 
     * with the contents of the custom type file.
     * 
     * @param property 
     * @returns 
     */
    private preProcessMsmType(properties: any): any {
        Object.keys(properties).forEach(key => {
            // Check if the current property itself has 'msmType'
            if (properties[key].hasOwnProperty('msmType')) {
                let typeFilename = this.config.getTypeFile(properties[key].msmType);
                const typeContent = readFileSync(typeFilename, 'utf-8');
                const typeDefinition = JSON.parse(typeContent);
                delete properties[key].msmType; // Remove the msmType property
                Object.assign(properties[key], typeDefinition); // Merge and overwrite properties
            }
    
            // If the property type is 'object', recurse on its 'properties'
            if (properties[key].type === 'object' && properties[key].properties) {
                properties[key].properties = this.preProcessMsmType(properties[key].properties);
            }
    
            // If the property type is 'array' and its items are of type 'object', recurse on the 'items' 'properties'
            if (properties[key].type === 'array' && properties[key].items && properties[key].items.type === 'object' && properties[key].items.properties) {
                properties[key].items.properties = this.preProcessMsmType(properties[key].items.properties);
            }
        });
    
        return properties;
    }

    /**
     * This function processes msmEnums Directives in schema, 
     * by adding the corresponding values from the system enumerators 
     */
    private preProcessMsmEnums(): void {
        Object.keys(this.schema.properties).forEach(key => {
            const property = this.schema.properties[key];
            if (property.hasOwnProperty('msmEnums')) {
                const enumName = property.msmEnums;
                const enumValues = this.config.getEnums(enumName);
                delete property.msmEnums;
                property.bsonType = "string"; 
                property.enum = Object.keys(enumValues);
            }
        });
    }

    /**
     * This function processes msmEnumList Directives in schema, 
     * by adding an array of strings, with enums values from the 
     * system enumerators 
     */
    private preProcessMsmEnumList(): void {
        Object.keys(this.schema.properties).forEach(key => {
            const property = this.schema.properties[key];
            if (property.hasOwnProperty('msmEnumList')) {
                const enumValues = this.config.getEnums(property.msmEnumList);
                delete property.msmEnumList; 
                property.bsonType = "array";
                property.items = {
                    bsonType: "string",
                    enum: Object.keys(enumValues)
                };
            }
        });
    }
}
