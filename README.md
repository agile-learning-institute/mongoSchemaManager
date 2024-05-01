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



## Issue 7

You should create a single index.html file, with embedded css and js, that uses fetch() to get the versions.json file, and then creates the page. The page should implement a top-level accordion control, that will have only one accordion open at a time. Each accordion title should be the collectionName and currentVersion from the versions.json file, in a large size, bold, font. The content of each accordion should be a swagger-viewer that uses CDN instances of the swagger-ui-bundle.js, and swagger-ui.css libraries to display the swagger from a file named {{collectionName}}-{{currentVersion}}.openapi.yaml. You should assume that your index.html, a versions.json file, and all the necessary openapi.yaml files will be in the same folder. I would prefer that this be a simple singe page application that does not rely on js frameworks like Vue, React, or Angular, and does not use CSS frameworks like bootstrap or materialDesign.

Test Data and Configurations
A test versions.json and the corresponding swagger files exist in the src/app folder.

Tasks to complete
 Update /src/app/index.html to contain your solution.
See the index.html and swagger.yaml from the Person API for an example of how to use the swagger libraries. 

See the generated GItHub Pages site to see the swagger viewer in action.

 Create npm run serve script to serve UI for testing with a simple web server pointed at the src/app folder.
 
 Make sure that your page, and test data/configurations can be put in the /docs folder and served up by GitHub Pages. This is the use case we are targeting. NOTE: You may have to create a test repo to verify this. Use the template repo, the ./msm test container script copies the generated files to the /docs folder.
 Update the template project README.md with instructions on how to configure gitHub Pages. The existing scripts will copy the generated files to the docs folder.
