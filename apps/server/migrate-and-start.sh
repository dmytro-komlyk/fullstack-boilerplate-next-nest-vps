#!/bin/sh

# Apply Prisma migrations and start the application
pnpx prisma generate

# Run database migrations
pnpx prisma db push

# Run the main container command
node dist/main.js
