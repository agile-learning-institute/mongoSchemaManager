# mongoSchemaManager

mongoSchemaManager is an **Open Source**, **MongoDB**, **Containerized**, **Configuration as Code**, **Schema Management** tool. This tool is designed to support the work of a data science engineer who is responsible for ensuring the quality, scalability, and performance of data captured and managed by a traditional CRUD based web applicaiton in a MongoDB Database. The tool is designed with automated deployment in mind, and streamlines the job of ensuring data quality in a programming language agnostic manner. 

## Who should use msm?
 As a data engineer responsible for a MongoDb Database, you are aware that [proper MongoDB schema design is the most critical part of deploying a scalable, fast, and affordable database](https://www.mongodb.com/developer/products/mongodb/mongodb-schema-design-best-practices/). Over time schema's will need to change. If we are lucky all of these changes will be relaxing constraints or adding new properties, but we are human and mistakes get made. This makes migrations at best a simple thing to manage, and at worst a necessary evil. msm is here to help manage those changes in your database.

## Quick Start
- Use [this Template Repo](https://github.com/agile-learning-institute/mongoSchemaManagerTemplate) to create a new schema management repo
- Follow the instructions in the README to setup your mongo database

## Prerequisites
- The only prerequisite for using this tool is [Docker](https://www.docker.com/products/docker-desktop/) and a [MongoDB](https://hub.docker.com/_/mongo) to manage.

## Reference
This tool works by connecting to a mongoDB, reading the configurations you provide and then creating the collections, schemas, and indexes described in those configurations. See [here](./docs/REFERENCE.md) for information on the different configuration options that are available. 

## Contributing
If you are interested in contributing to this work you can find information on how to do that [here](./docs/CONTRIBUTING.md).