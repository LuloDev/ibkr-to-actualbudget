#!/bin/sh

# Default cron schedule
CRON_SCHEDULE=${CRON_SCHEDULE:-'55 23 * * *'}

# Create a temporary crontab file
echo "MAILTO=" > /etc/crontabs/root
echo "$CRON_SCHEDULE /usr/local/bin/node /usr/src/app/dist/index.js 2>&1 | tee -a /var/log/cron.log" >> /etc/crontabs/root

# Give execute permissions to the crontab file
chmod 0644 /etc/crontabs/root

# Start cron in the foreground
crond
touch /var/log/cron.log
tail -f /var/log/cron.log