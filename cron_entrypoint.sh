#!/bin/sh

# Default cron schedule
CRON_SCHEDULE=${CRON_SCHEDULE:-'55 23 * * *'}

# Create a temporary crontab file
echo "MAILTO=\"\"" > /etc/crontabs/root
echo "NODE_ENV=\"$NODE_ENV\"" >> /etc/crontabs/root
echo "IBKR_TOKEN=\"$IBKR_TOKEN\"" >> /etc/crontabs/root
echo "IBKR_QUERY_ID=\"$IBKR_QUERY_ID\"" >> /etc/crontabs/root
echo "ACTUAL_BUDGET_ID=\"$ACTUAL_BUDGET_ID\"" >> /etc/crontabs/root
echo "ACTUAL_SYNC_ACCOUNT_ID=\"$ACTUAL_SYNC_ACCOUNT_ID\"" >> /etc/crontabs/root
echo "ACTUAL_SERVER_URL=\"$ACTUAL_SERVER_URL\"" >> /etc/crontabs/root
echo "ACTUAL_SERVER_PASSWORD=\"$ACTUAL_SERVER_PASSWORD\"" >> /etc/crontabs/root
echo "ACTUAL_BUDGET_CURRENCY=\"$ACTUAL_BUDGET_CURRENCY\"" >> /etc/crontabs/root
echo "EXCHANGE_RATE_API_KEY=\"$EXCHANGE_RATE_API_KEY\"" >> /etc/crontabs/root
echo "$CRON_SCHEDULE /usr/local/bin/node /usr/src/app/dist/index.js 2>&1 | tee -a /var/log/cron.log" >> /etc/crontabs/root

# Give execute permissions to the crontab file
chmod 0644 /etc/crontabs/root

# Start cron in the foreground
crond
touch /var/log/cron.log
tail -f /var/log/cron.log