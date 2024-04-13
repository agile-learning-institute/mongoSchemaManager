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
        this.schema.properties = this.preProcessMsmType(this.schema.properties);
        this.schema.properties = this.preProcessMsmEnums(this.schema.properties);
        this.schema.properties = this.preProcessMsmEnumList(this.schema.properties);

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
            let property = properties[key];

            // Check if the current property itself has 'msmType'
            if (properties[key].hasOwnProperty('msmType')) {
                const typeDefinition = this.config.getType(properties[key].msmType);
                delete properties[key].msmType; // Remove the msmType property
                Object.assign(properties[key], typeDefinition); // Merge and overwrite properties
            }

            // If the property type is 'array' and its items are of type 'msmType', process type
            if (properties[key].bsonType && properties[key].bsonType === 'array' && properties[key].items && properties[key].items.msmType) {
                const typeDefinition = this.config.getType(properties[key].items.msmType);
                delete properties[key].items.msmType; // Remove the msmType property
                Object.assign(properties[key].items, typeDefinition); // Merge and overwrite properties
            }

            // If the property type is 'array' and its items are of type 'object', recurse on the 'items' 'properties'
            if (properties[key].bsonType && properties[key].bsonType === 'array' && properties[key].items && properties[key].items.bsonType === 'object' && properties[key].items.properties) {
                properties[key].items.properties = this.preProcessMsmType(properties[key].items.properties);
            }

            // If the property type is 'object', recurse on its 'properties'
            if (properties[key].bsonType && properties[key].bsonType === 'object' && properties[key].properties) {
                properties[key].properties = this.preProcessMsmType(properties[key].properties);
            }
        });

        return properties;
    }

    /**
     * This function processes msmEnums Directives in the schema, 
     * by adding the corresponding values from the system enumerators 
     */
    private preProcessMsmEnums(properties: any): any {
        Object.keys(properties).forEach(key => {
            let property = properties[key];

            // Check if the current property has msmENums
            if (property.hasOwnProperty('msmEnums')) {
                property = this.addEnums(property);
            }

            // If the property type is 'array' and its items are of type 'msmEnums', process type
            if (property.bsonType && property.bsonType === 'array' && property.items && property.items.msmEnums) {
                property.items = this.addEnums(property.items);
            }

            // If the property type is 'array' and its items are of type 'object', recurse on the 'items' 'properties'
            if (property.bsonType && property.bsonType === 'array' && property.items && property.items.bsonType === 'object' && property.items.properties) {
                property.items.properties = this.preProcessMsmEnums(properties[key].items.properties);
            }

            // If the property type is 'object', recurse on its 'properties'
            if (property.bsonType && property.bsonType === 'object' && property.properties) {
                property.properties = this.preProcessMsmEnums(property.properties);
            }
        });
        return properties;
    }

    /**
     * Helper function to add enums to a property
     * 
     * @param property the property to add enums to
     * @returns the property with enums added
     */
    private addEnums(property: any): any {
        const enumName = property.msmEnums
        const enumValues = this.config.getEnums(this.version.enums, enumName);
        property.bsonType = "string";
        property.enum = Object.keys(enumValues);
        delete property.msmEnums;
        return property;
    }

    /**
     * This function processes msmEnumList Directives in a schema, 
     * by adding an array of strings, with enums values from the 
     * system enumerators 
     */
    private preProcessMsmEnumList(properties: any): any {
        Object.keys(properties).forEach(key => {
            let property = properties[key];

            // check if current property has enumList
            if (property.hasOwnProperty('msmEnumList')) {
                property = this.addEnumList(property);
            }

            // If the property type is 'array' and its items are of type 'object', recurse on the 'items' 'properties'
            if (property.bsonType === 'array' && property.items && property.items.bsonType === 'object' && property.items.properties) {
                property.items.properties = this.preProcessMsmEnumList(property.items.properties);
            }

            // If the property type is 'object', recurse on its 'properties'
            if (property.bsonType === 'object' && property.properties) {
                property.properties = this.preProcessMsmEnumList(property.properties);
            }

        });
        return properties;
    }

    /**
     * Simple helper function to add array of enums to property
     * @param property the property to add enums to
     * @returns the property with enums added
     */
    private addEnumList(property: any): any {     
        const enumName = property.msmEnumList
        const enumValues = this.config.getEnums(this.version.enums, enumName);

        // Add array of strings
        property.bsonType = "array";
        property.items = {
            bsonType: "string",
            enum: Object.keys(enumValues)
        };
        delete property.msmEnumList;

        return property;
    }
}
