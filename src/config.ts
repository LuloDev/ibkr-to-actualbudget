export interface Config {
  ibkr: {
    token: string;
    queryId: string;
  };
  actual: {
    budgetId: string;
    syncAccountId: string;
    serverUrl: string;
    serverPassword: string;
    currency: string;
  };
  currencyApi: {
    exchangeRateApiKey?: string;
  };
}

export function getConfig(): Config {
  const config: Config = {
    ibkr: {
      token: process.env.IBKR_TOKEN || '',
      queryId: process.env.IBKR_QUERY_ID || '',
    },
    actual: {
      budgetId: process.env.ACTUAL_BUDGET_ID || '',
      syncAccountId: process.env.ACTUAL_SYNC_ACCOUNT_ID || '',
      serverUrl: process.env.ACTUAL_SERVER_URL || '',
      serverPassword: process.env.ACTUAL_SERVER_PASSWORD || '',
      currency: process.env.ACTUAL_BUDGET_CURRENCY || 'USD',
    },
    currencyApi: {
      exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY,
    },
  };

  // Basic validation for required fields
  for (const [key, value] of Object.entries(config.ibkr)) {
    if (!value) throw new Error(`Missing environment variable: IBKR_${key.toUpperCase()}`);
  }
  if (!config.actual.budgetId) throw new Error('Missing environment variable: ACTUAL_BUDGET_ID');
  if (!config.actual.syncAccountId) throw new Error('Missing environment variable: ACTUAL_SYNC_ACCOUNT_ID');
  if (!config.actual.serverUrl) throw new Error('Missing environment variable: ACTUAL_SERVER_URL');
  if (!config.actual.serverPassword) throw new Error('Missing environment variable: ACTUAL_SERVER_PASSWORD');

  return config;
}
