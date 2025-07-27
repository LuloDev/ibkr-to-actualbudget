#!/bin/sh

# Default cron schedule
CRON_SCHEDULE=${CRON_SCHEDULE:-'55 23 * * *'}

# Create a temporary crontab file
echo "$CRON_SCHEDULE node /usr/src/app/dist/index.js >> /var/log/cron.log 2>&1" > /etc/crontabs/root

# Give execute permissions to the crontab file
chmod 0644 /etc/crontabs/root

# Start cron in the foreground
cron -f