FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Install cron
RUN apk add --no-cache cron

# Copy the cron entrypoint script
COPY cron_entrypoint.sh /usr/local/bin/cron_entrypoint.sh
RUN chmod +x /usr/local/bin/cron_entrypoint.sh

# Run the cron entrypoint script
ENTRYPOINT ["cron_entrypoint.sh"]
