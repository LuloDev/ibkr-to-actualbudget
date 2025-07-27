# IBKR to Actual Budget

This program retrieves your account balance from Interactive Brokers and updates it in Actual Budget.

## Setup

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Configuration:**

    Create a `.env` file in the root of the project by copying `.env.sample` and filling in your credentials.

    *   **`IBKR_FLEX_QUERY_TOKEN`**: Your Interactive Brokers Flex Query Token.
        *   To obtain this, log in to Client Portal, go to **Reports > Flex Queries**, and create a new Flex Query.
        *   Ensure the query includes **Account Balance** data.
        *   Once created, you will find your token associated with the query.
    *   **`IBKR_FLEX_QUERY_ID`**: The ID of your Flex Query.
        *   This is also found in the Flex Queries section of Client Portal, next to your Flex Query name.
    *   **`ACTUAL_BUDGET_URL`**: The URL of your Actual Budget instance (e.g., `http://localhost:5000`).
    *   **`ACTUAL_BUDGET_PASSWORD`**: Your Actual Budget password.
    *   **`ACTUAL_BUDGET_BUDGET_ID`**: The ID of the budget you want to update in Actual Budget.
        *   You can find this in the URL when you are viewing your budget in Actual Budget (e.g., `http://localhost:5000/budget/<BUDGET_ID>`).
    *   **`ACTUAL_BUDGET_SYNC_ACCOUNT_ID`**: The ID of the account in Actual Budget that will be synced with IBKR.
        *   You can find this in the URL when you are viewing the account in Actual Budget (e.g., `http://localhost:5000/accounts/<ACCOUNT_ID>`).
    *   **`ACTUAL_BUDGET_CURRENCY`**: The 3-letter currency code (e.g., `USD`, `EUR`) of your Actual Budget file. Defaults to `USD` if not provided.
    *   **`EXCHANGE_RATE_API_KEY`**: Your API key for ExchangeRate-API.
        *   Get a free API key from [ExchangeRate-API](https://www.exchangerate-api.com/). This is used for currency conversion if your IBKR account and Actual Budget are in different currencies.

3.  **Build the project:**

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

### Running with Docker

1.  **Build the Docker image:**

    ```bash
    docker build -t ibkr-to-actualbudget .
    ```

2.  **Run the Docker container:**

    You can pass the environment variables to the Docker container using the `--env-file` option:

    ```bash
    docker run --env-file .env ibkr-to-actualbudget
    ```

## Daily Updates

To run the script daily, you can set up a cron job on your server to execute the `docker run` command with the `--env-file` option.

## Troubleshooting

*   **`Error: Request failed with status code 404` or `Network Error`**:
    *   Check your `IBKR_FLEX_QUERY_TOKEN` and `IBKR_FLEX_QUERY_ID` in your `.env` file. Ensure they are correct and haven't expired.
    *   Verify your internet connection.
    *   If using Docker, ensure the container has network access.
*   **`Flex Query SendRequest failed: Token has expired.`**:
    *   Your IBKR Flex Query Token has expired. Generate a new one in the Client Portal.
*   **`ExchangeRate-API error: unsupported-code` or `Exchange rate not found`**:
    *   Check your `EXCHANGE_RATE_API_KEY`. Ensure it's valid and you have not exceeded your API call limit.
    *   Verify that the currency codes used (IBKR account currency and `ACTUAL_BUDGET_CURRENCY`) are valid and supported by ExchangeRate-API.
*   **`Error updating Actual Budget: Conversion failed`**:
    *   This usually indicates an issue with currency conversion. Double-check your `ACTUAL_BUDGET_CURRENCY` and `EXCHANGE_RATE_API_KEY`.
*   **`Cannot read properties of undefined (reading '0')` or XML parsing errors**:
    *   This might indicate an issue with the XML response from Interactive Brokers. Ensure your Flex Query is correctly configured to include the necessary account balance data. The structure of the XML might have changed, or the data is missing.
*   **`Failed to retrieve Flex Statement after X attempts.`**:
    *   The Flex Statement might not be ready yet. This can happen if you run the script too soon after requesting the report. The script has a retry mechanism, but persistent failures might indicate a deeper issue with the Flex Query or IBKR's service.
    *   Check the IBKR Client Portal for any service announcements or issues.
