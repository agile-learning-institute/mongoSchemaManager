import { Config } from "../config/Config";
import { VersionNumber } from "./VersionNumber";

/**
 * This class is responsible for pre-processing schema files
 */
export class Schema {
    private schema: any;
    private config: Config;
    private version: VersionNumber;

    /**
     * The constructor is responsible for getting the schema files 
     * and pre-processing any msm directives.
     * 
     * @param config Dependency injection
     * @param collection The collection name
     * @param version The version of this schema to process
     */
    constructor(config: Config, collection: string, version: VersionNumber) {
        this.config = config;
        this.version = version;
        this.schema = this.config.getSchema(collection, version);
        this.schema.properties = this.preProcessMsmType(this.schema.properties); // Process the entire schema recursively
        this.preProcessMsmEnums();
        this.preProcessMsmEnumList();

        console.info("Schema For Collection:" + collection, "Version:" + version.getVersionString(), "Schema:" + JSON.stringify(this.schema)); 
    }

    /**
     * A simple getter
     * 
     * @returns The processed schema
     */
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
                const typeDefinition = this.config.getType(properties[key].msmType);
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
     * This function processes msmEnums Directives in the schema, 
     * by adding the corresponding values from the system enumerators 
     */
    private preProcessMsmEnums(): void {
        Object.keys(this.schema.properties).forEach(key => {
            const property = this.schema.properties[key];
            if (property.hasOwnProperty('msmEnums')) {
                const enumName = property.msmEnums;
                const enumValues = this.config.getEnums(this.version.enums, enumName);
                delete property.msmEnums;
                property.bsonType = "string"; 
                property.enum = Object.keys(enumValues);
            }
        });
    }

    /**
     * This function processes msmEnumList Directives in a schema, 
     * by adding an array of strings, with enums values from the 
     * system enumerators 
     */
    private preProcessMsmEnumList(): void {
        Object.keys(this.schema.properties).forEach(key => {
            const property = this.schema.properties[key];
            if (property.hasOwnProperty('msmEnumList')) {
                const enumValues = this.config.getEnums(this.version.enums, property.msmEnumList);
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
