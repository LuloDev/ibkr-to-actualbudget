#!/bin/sh

export NODE_ENV=$NODE_ENV
export IBKR_TOKEN=$IBKR_TOKEN
export IBKR_QUERY_ID=$IBKR_QUERY_ID
export ACTUAL_BUDGET_ID=$ACTUAL_BUDGET_ID
export ACTUAL_SYNC_ACCOUNT_ID=$ACTUAL_SYNC_ACCOUNT_ID
export ACTUAL_SERVER_URL=$ACTUAL_SERVER_URL
export ACTUAL_SERVER_PASSWORD=$ACTUAL_SERVER_PASSWORD
export ACTUAL_BUDGET_CURRENCY=$ACTUAL_BUDGET_CURRENCY
export EXCHANGE_RATE_API_KEY=$EXCHANGE_RATE_API_KEY

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