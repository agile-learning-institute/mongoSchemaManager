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
To start a fresh mongoDB instance and run locally using the configurations in ``/test/resources`` use
```bash
npm run start
```

## Test Container Locally
To build the container, run a fresh mongoDb instance, and run the container using ``test/resources`` folder
```bash
npm run container
```