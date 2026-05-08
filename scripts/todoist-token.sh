#!/bin/bash
# Prints the Todoist API token from environment.
# Set TODOIST_API_TOKEN in your shell profile or .env

if [ -n "$TODOIST_API_TOKEN" ]; then
  echo "$TODOIST_API_TOKEN"
  exit 0
fi

echo "⚠️  TODOIST_API_TOKEN is not set. Add it to your shell profile or .env.local" >&2
exit 1
