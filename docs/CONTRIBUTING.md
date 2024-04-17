# Contributing to mongoSchemaManager

Thank you very much for your interest in contributing. Please feel free use gitHub to facilitate discussion, open issues, create branches and PR's with your ideas. 

## Prerequisites
- npm
- Docker

## Install Dependencies
```bash
npm install
```

## Run Jest Unit Tests
```bash
npm run test
```

## Run Script Locally 
NOTE: This uses the configurations in the test/resources folder, starts a mongodb container for testing
```bash
npm run start
```

## Test Container Locally
This command will build the contaienr locally, and start a mongodb container, and then the msm container when the database is healthy. The ``test/resrouces`` folder is mounted as the configurations folder used by msm, and the log file is tailed.
```bash
npm run container
```