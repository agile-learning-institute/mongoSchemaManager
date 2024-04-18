import { Config } from "../config/Config";
import { VersionNumber } from "./VersionNumber";

/**
 * This class is responsible for pre-processing schema files
 */
export class Schema {
    private schema: any;
    private swagger: any;
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

        // Build Schema and Preprocess
        this.schema = this.config.getSchema(collection, version);
        this.schema.properties = this.preProcess(this.schema.properties, "msmType", this.addType);
        this.schema.properties = this.preProcess(this.schema.properties, "msmEnums", this.addEnums);
        this.schema.properties = this.preProcess(this.schema.properties, "msmEnumList", this.addEnumList);

        // Build Swagger and PreProcess
        const swaggerSchema = this.setSwaggerType(JSON.parse(JSON.stringify(this.schema)));
        swaggerSchema.properties = this.preProcess(swaggerSchema.properties, "bsonType", this.setSwaggerType);
        const info = {"title":collection, "version": version.getVersionString()};
        const pathName = "/" + collection + "/";
        const path: any = {};
        path[pathName] = {"get": {"responses": {"200": {"description":"Success","content": {"application/json": {"schema":{"$ref":"#/components/schemas/" + collection}}}}}}}; 
        const components: any = {"schemas": {}};
        components.schemas[collection] = swaggerSchema;

        this.swagger = {"openapi": "3.0.3"}
        this.swagger.info = info;
        this.swagger.paths = path;
        this.swagger.components = components;
    }

    /**
     * A simple Schema getter
     * 
     * @returns The processed schema
     */
    public getSchema(): any {
        return this.schema;
    }

    /**
     * A simple Swagger getter
     * 
     * @returns The processed schema
     */
    public getSwagger(): any {
        return this.swagger;
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
            if (this.isArrayOfType(property, type)) {
                properties[key].items = process(property.items);
            }

            // If the property type is 'array' and its items are of type 'object', recurse on the 'items' 'properties'
            if (this.isArrayOfObject(property)) {
                properties[key].items.properties = this.preProcess(property.items.properties, type, process);
            }

            // If the property type is 'object', recurse on its 'properties'
            if (this.isObject(property)) {
                properties[key].properties = this.preProcess(property.properties, type, process);
            }
        });

        return properties;
    }

    /**
     * Helper functions to test a property
     */
    private isArrayOfType(property: any, type: string): boolean {
        if (this.isArray(property) &&
            property.items &&
            property.items.hasOwnProperty(type)) {
            return true;
        }
        return false;
    }

    private isArrayOfObject(property: any): boolean {
        return this.isArray(property) &&
            property.items &&
            this.isObject(property.items);
    }

    private isArray(property: any): boolean {
        return (property.bsonType && property.bsonType === 'array') ||
            (property.type && property.type === 'array');
    }

    private isObject(property: any): boolean {
        return (((property.bsonType && property.bsonType === 'object') ||
            (property.type && property.type === 'object')) &&
            property.properties);
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

    /**
     * Set the swagger property type based on a bsonType value
     * 
     * @param property the property to update
     * @returns the updated value
     */
    private setSwaggerType = (property: any): any => {
        let theType = property.bsonType;
        switch (theType) {
            case "objectId":
            case "date":
            case "regex":
            case "javascript":
            case "timestamp":
                theType = "string";
                break;

            case "double":
            case "int":
            case "long":
            case "decimal":
            case "minKey":
            case "maxKey":
                theType = "number";
                break;

            case "bool":
                theType = "boolean";
        }
        property.type = theType;
        delete property.bsonType;
        return property;
    }
}
