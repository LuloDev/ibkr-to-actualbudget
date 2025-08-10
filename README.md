# IBKR to Actual Budget

This program retrieves your account balance from Interactive Brokers and updates it in Actual Budget.

## Features

- **Automated Balance Retrieval**: Automatically fetches account balance data from Interactive Brokers using Flex Queries.
- **Actual Budget Integration**: Updates a specified account in Actual Budget with the latest balance.
- **Currency Conversion**: Supports currency conversion between IBKR and Actual Budget using ExchangeRate-API.
- **Configurable Scheduling**: Runs as a daily cron job within a Docker container, with the schedule configurable via environment variables.
- **Docker Compose Support**: Easily deployable and manageable using Docker Compose.

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configuration:**

   Create a `.env` file in the root of the project by copying `.env.sample` and filling in your credentials.
   - **`IBKR_FLEX_QUERY_TOKEN`**: Your Interactive Brokers Flex Query Token.
     - To obtain this, log in to Client Portal, go to **Reports > Flex Queries**, generate token in **Flex Web Service Configuration**.

   - **`IBKR_FLEX_QUERY_ID`**: The ID of your Flex Query.
     - To generate a report in IBKR, follow these steps:
       1. Log in to your account on the web app.
       2. Navigate to Performance & Reports > Flex Queries.
       3. Create a new Activity Flex Query.
       4. Select **Net Asset Value (NAV)** in Base.
       5. Activate the following options:
          - Account Id
          - Account alias
          - Currency
          - Report Date
          - Total
          - Cash
          - Stock
       6. Configure the following options:
          Models: Optional
          Format: XML
          Period: Last Business Day
          Date Format: dd/MM/yyyy
          Time Format: HHmmss
          Date/Time Separator: ' ' (single space)
          Other options: Default
       7. Create the report and click the edit button to view the `Query ID`

   - **`ACTUAL_BUDGET_URL`**: The URL of your Actual Budget instance (e.g., `http://localhost:5000`).
   - **`ACTUAL_BUDGET_PASSWORD`**: Your Actual Budget password.
   - **`ACTUAL_BUDGET_BUDGET_ID`**: The ID of the budget you want to update in Actual Budget.
     - You can find this in the URL when you are viewing your budget in Actual Budget Settings > Show advanced settings > Sync ID.
   - **`ACTUAL_BUDGET_SYNC_ACCOUNT_ID`**: The ID of the account in Actual Budget that will be synced with IBKR.
     - You can find this in the URL when you are viewing the account in Actual Budget (e.g., `http://localhost:5000/accounts/<ACCOUNT_ID>`).
   - **`ACTUAL_BUDGET_CURRENCY`**: The 3-letter currency code (e.g., `USD`, `EUR`) of your Actual Budget file. Defaults to `USD` if not provided.
   - **`EXCHANGE_RATE_API_KEY`**: Your API key for ExchangeRate-API.
     - Get a free API key from [ExchangeRate-API](https://www.exchangerate-api.com/). This is used for currency conversion if your IBKR account and Actual Budget are in different currencies. If your IBKR account and Actual Budget are in the same currency, you do not need to use the API for conversion, as no conversion is necessary

3. **Build the project:**

   ```bash
   npm run build
   ```

## Usage

### Running directly

To run the script directly, you need to load the environment variables from the `.env` file. You can use a package like `dotenv` for this.

First, install `dotenv`:

```bash
npm install dotenv
```

Then, you can run the script like this:

```bash
node -r dotenv/config dist/index.js
```

### Development Mode

To run the project in development mode (with file watching and automatic restarts):

```bash
npm run dev
```

### Running with Docker Compose

You can use Docker Compose to manage the `ibkr-to-actualbudget` service.

```yaml
version: "3.8"

services:
  ibkr-to-actualbudget:
    image: ghcr.io/lulodev/ibkr-to-actualbudget:latest
    restart: unless-stopped
    environment:
      # Copy your environment variables from .env.sample here, or use a .env file
      - IBKR_TOKEN=${IBKR_TOKEN}
      - IBKR_QUERY_ID=${IBKR_QUERY_ID}
      - ACTUAL_BUDGET_ID=${ACTUAL_BUDGET_ID}
      - ACTUAL_SYNC_ACCOUNT_ID=${ACTUAL_SYNC_ACCOUNT_ID}
      - ACTUAL_SERVER_URL=${ACTUAL_SERVER_URL}
      - ACTUAL_SERVER_PASSWORD=${ACTUAL_SERVER_PASSWORD}
      - ACTUAL_BUDGET_CURRENCY=${ACTUAL_BUDGET_CURRENCY:-USD}
      - EXCHANGE_RATE_API_KEY=${EXCHANGE_RATE_API_KEY}
      - CRON_SCHEDULE=${CRON_SCHEDULE:-55 23 * * *} # Default to 11:55 PM daily
    volumes:
      # Optional: Mount a volume for logs or other persistent data if needed
      - data-ibkr:/usr/src/app/data
volumes:
  data-ibkr: null
```

Make sure to create a `.env` file in the same directory as your `docker-compose.yml` with all the necessary environment variables (e.g., `IBKR_TOKEN`, `ACTUAL_SERVER_URL`, etc.).

To run the service:

```bash
docker compose up -d
```

## Troubleshooting

- **`Error: Request failed with status code 404` or `Network Error`**:
  - Check your `IBKR_FLEX_QUERY_TOKEN` and `IBKR_FLEX_QUERY_ID` in your `.env` file. Ensure they are correct and haven't expired.
  - Verify your internet connection.
  - If using Docker, ensure the container has network access.
- **`Flex Query SendRequest failed: Token has expired.`**:
  - Your IBKR Flex Query Token has expired. Generate a new one in the Client Portal.
- **`ExchangeRate-API error: unsupported-code` or `Exchange rate not found`**:
  - Check your `EXCHANGE_RATE_API_KEY`. Ensure it's valid and you have not exceeded your API call limit.
  - Verify that the currency codes used (IBKR account currency and `ACTUAL_BUDGET_CURRENCY`) are valid and supported by ExchangeRate-API.
- **`Error updating Actual Budget: Conversion failed`**:
  - This usually indicates an issue with currency conversion. Double-check your `ACTUAL_BUDGET_CURRENCY` and `EXCHANGE_RATE_API_KEY`.
- **`Cannot read properties of undefined (reading '0')` or XML parsing errors**:
  - This might indicate an issue with the XML response from Interactive Brokers. Ensure your Flex Query is correctly configured to include the necessary account balance data. The structure of the XML might have changed, or the data is missing.
- **`Failed to retrieve Flex Statement after X attempts.`**:
  - The Flex Statement might not be ready yet. This can happen if you run the script too soon after requesting the report. The script has a retry mechanism, but persistent failures might indicate a deeper issue with the Flex Query or IBKR's service.
  - Check the IBKR Client Portal for any service announcements or issues.
