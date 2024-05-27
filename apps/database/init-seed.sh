#!/bin/sh

mongoimport --uri "YOUR_MONGO_URI" --collection examples --type json --file seed/examples.json --jsonArray