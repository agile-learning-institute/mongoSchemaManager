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
        this.schema.properties = this.preProcess(this.schema.properties, "msmType", this.addType);
        this.schema.properties = this.preProcess(this.schema.properties, "msmEnums", this.addEnums);
        this.schema.properties = this.preProcess(this.schema.properties, "msmEnumList", this.addEnumList);

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
     * identified with the provided custom property. The property 
     * is processed with the provided process function. Sub-Objects, 
     * Arrays of Object, and Arrays of Type are recursed. 
     * 
     * @param properties a schema properties element 
     * @param type the directive type 
     * @param process the helper function that implements the type 
     * @returns the updated properties structure
     */
    private preProcess(properties: any, type: string, process: (property: any) => any): any {
        Object.keys(properties).forEach(key => {
            let property = properties[key];

            // Check if the current property itself has the target directive type
            if (property.hasOwnProperty(type)) {
                properties[key] = process(property);
            }

            // If the property type is 'array' and its items are of type directive, process type
            if (property.bsonType && property.bsonType === 'array' && 
                property.items && property.items.hasOwnProperty(type)) {
                    properties[key].items = process(property.items);
            }

            // If the property type is 'array' and its items are of type 'object', recurse on the 'items' 'properties'
            if (property.bsonType && property.bsonType === 'array' && property.items && 
                property.items.bsonType === 'object' && property.items.properties) {
                    properties[key].items.properties = this.preProcess(property.items.properties, type, process);
            }

            // If the property type is 'object', recurse on its 'properties'
            if (property.bsonType && property.bsonType === 'object' && property.properties) {
                properties[key].properties = this.preProcess(property.properties, type, process);
            }
        });

        return properties;
    }

    /**
     * Process function to add custom type to a property
     * 
     * @param property the property to add custom type to
     * @returns the property with type added
     */
    private addType = (property: any): any => {
        const typeDefinition = this.config.getType(property.msmType);
        Object.assign(property, typeDefinition);

        delete property.msmType;                
        return property;
    }

    /**
    * Process function to add enums to a property
    * 
    * @param property the property to add enums to
    * @returns the property with enums added
    */
    private addEnums = (property: any): any => {
        const enumName = property.msmEnums
        const enumValues = this.config.getEnums(this.version.enums, enumName);
        property.bsonType = "string";
        property.enum = Object.keys(enumValues);

        delete property.msmEnums;
        return property;
    }


    /**
     * Process helper function to add array of enums to property
     * 
     * @param property the property to add enumsList to
     * @returns the property with enumList added
     */
    private addEnumList = (property: any): any => {
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
