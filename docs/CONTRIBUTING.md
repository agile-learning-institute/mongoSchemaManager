# Contributing to mongoSchemaManager

Thank you very much for your interest in contributing. Please feel free use gitHub to facilitate discussion, open issues, create branches and PR's with your ideas. 

## Prerequisites
- npm
- Docker

## Install Dependencies
```bash
npm install
```

## Compile Typescript code
```bash
npm run build
```

## Run Jest Unit Tests
```bash
npm run test
```

## Run Script Locally 
NOTE: This uses the configurations in the test/resources folder, and assumes that a mongodb database is available at localhost. See [Config.mongo.test.ts](../src/config/Config.mongo.test.ts) for information on how to run a mongo container.
```bash
npm run start
```

## Test Container Locally
This command will build the contaienr locally, and start a mongodb container, and start the msm container when the database is healthy. The ``test/resrouces`` folder is mounted as the configurations folder used.

You can use ``docker logs`` to check the output logs from the msm container to verify that it completed correctly.
```bash
npm run container
```