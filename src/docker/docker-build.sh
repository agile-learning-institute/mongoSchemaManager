#!/bin/bash

echo "Ensure we are running in the proper folder"
if !([[ -d "./src/docker" ]] && [[ -d "./src/main.ts" ]]); then 
    echo "This script must be run from the repository root folder"
    exit 1
fi

echo "Building Docker Image"
docker build --file src/docker/Dockerfile --tag ghcr.io/agile-learning-institute/schemaManager:latest .
if [ $? -ne 0 ]; then
    echo "Docker build failed"
    exit 1
fi

# Run the manager with test data
#mh up mongoonly
