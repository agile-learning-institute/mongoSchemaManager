# Build stage
FROM node:16 AS build

# Install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# Build server deployment 
COPY . .
RUN npm run build
COPY src/msmTypes dist/msmTypes

# Record build time
RUN DATE=$(date "+%Y-%m-%d:%H:%M:%S") && \
    echo $DATE > dist/BUILT_AT

# Final Stage
FROM node:16 AS run

# Default Environment Variable config values
# ENV CONNECTION_STRING=mongodb://root:example@localhost:27017
# ENV CONFIG_FOLDER=/opt/mongoSchemaManager/config
# ENV MSM_ROOT=/opt/mongoSchemaManager
# ENV DB_NAME=test
# ENV LOAD_TEST_DATA=false

# Copy built assets from build stage 
COPY --from=build /app/dist /opt/mongoSchemaManager
COPY --from=build /app/node_modules /opt/mongoSchemaManager/node_modules

# Set the working directory
WORKDIR /opt/mongoSchemaManager

# Run the processor
ENTRYPOINT ["node", "CollectionProcessor.js"]
