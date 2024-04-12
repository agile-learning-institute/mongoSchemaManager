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
NOTE: This uses the configurations in the test/resources folder. 
```bash
npm run start
```

## Build Container Locally
```bash
npm run containerize
```

## Test Container locally
NOTE: This mounts the configurations from test/resources into the container
```bash
npm run container
```
