# start the testmongo mongo database container
mh up mongoonly

# sleep to give the mongo container time to get started before the script is executed
sleep 5

# Set environment variable
export DB_HOST=localhost
export DB_NAME=agile-learning-institute
export DB_USER=root
export DB_PASSWORD=example
export LOAD_TEST=true

# package and execute 
npm build
node main.ts
