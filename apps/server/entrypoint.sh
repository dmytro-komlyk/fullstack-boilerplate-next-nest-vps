#!/bin/sh

# Apply Prisma migrations and start the application
pnpx prisma generate

# Run database migrations
pnpx prisma db seed

# Run the main container command
exec "$@"
