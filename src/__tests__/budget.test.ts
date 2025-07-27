
import * as actualApi from '@actual-app/api';
import { updateBudget } from '../budget';
import { Config } from '../config';
import { convertCurrency } from '../currency';

jest.mock('@actual-app/api', () => ({
  init: jest.fn(),
  downloadBudget: jest.fn(),
  getAccountBalance: jest.fn(),
  addTransactions: jest.fn(),
  shutdown: jest.fn(),
  utils: {
    amountToInteger: jest.fn(),
    integerToAmount: jest.fn(),
  },
}));

const mockedActualApi = actualApi as jest.Mocked<typeof actualApi>;

jest.mock('../currency');
const mockedConvertCurrency = convertCurrency as jest.MockedFunction<typeof convertCurrency>;

describe('updateBudget', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks for actualApi utilities
    (mockedActualApi.utils.amountToInteger as jest.Mock).mockImplementation((amount: number) => Math.round(amount * 100));
    (mockedActualApi.utils.integerToAmount as jest.Mock).mockImplementation((amount: number) => amount / 100);
  });

  const config: Config = {
    ibkr: {
      token: 'test_token',
      queryId: 'test_query_id',
    },
    actual: {
      budgetId: 'test_budget_id',
      syncAccountId: 'test_sync_account_id',
      serverUrl: 'test_server_url',
      serverPassword: 'test_server_password',
      currency: 'USD',
    },
    currencyApi: {
      exchangeRateApiKey: 'test_api_key',
    },
  };

  it('should add a deposit transaction if IBKR balance is higher and currencies match', async () => {
    const ibkrBalance = 15000.00;
    const ibkrCurrency = 'USD';
    const currentActualBalanceInteger = 1000000; // Represents 10000.00

    mockedActualApi.getAccountBalance.mockResolvedValue(currentActualBalanceInteger);

    await updateBudget({ balance: ibkrBalance, currency: ibkrCurrency }, config);

    const expectedDifference = ibkrBalance - (currentActualBalanceInteger / 100);
    expect(mockedActualApi.addTransactions).toHaveBeenCalledWith(config.actual.syncAccountId, [
      {
        account: config.actual.syncAccountId,
        amount: Math.round(expectedDifference * 100),
        date: new Date().toISOString().split('T')[0],
        payee_name: 'IBKR Balance Adjustment',
        notes: 'Balance adjustment from Interactive Brokers',
      },
    ]);
    expect(mockedConvertCurrency).not.toHaveBeenCalled();
  });

  it('should add a withdrawal transaction if IBKR balance is lower and currencies match', async () => {
    const ibkrBalance = 5000.00;
    const ibkrCurrency = 'USD';
    const currentActualBalanceInteger = 1000000; // Represents 10000.00

    mockedActualApi.getAccountBalance.mockResolvedValue(currentActualBalanceInteger);

    await updateBudget({ balance: ibkrBalance, currency: ibkrCurrency }, config);

    const expectedDifference = ibkrBalance - (currentActualBalanceInteger / 100);
    expect(mockedActualApi.addTransactions).toHaveBeenCalledWith(config.actual.syncAccountId, [
      {
        account: config.actual.syncAccountId,
        amount: Math.round(expectedDifference * 100),
        date: new Date().toISOString().split('T')[0],
        payee_name: 'IBKR Balance Adjustment',
        notes: 'Balance adjustment from Interactive Brokers',
      },
    ]);
    expect(mockedConvertCurrency).not.toHaveBeenCalled();
  });

  it('should not add a transaction if the balance is in sync (negligible difference) and currencies match', async () => {
    const ibkrBalance = 10000.00;
    const ibkrCurrency = 'USD';
    const currentActualBalanceInteger = 1000000; // Represents 10000.00

    mockedActualApi.getAccountBalance.mockResolvedValue(currentActualBalanceInteger);

    await updateBudget({ balance: ibkrBalance, currency: ibkrCurrency }, config);

    expect(mockedActualApi.addTransactions).not.toHaveBeenCalled();
    expect(mockedConvertCurrency).not.toHaveBeenCalled();
  });

  it('should convert currency and add a deposit transaction if IBKR balance is higher and currencies differ', async () => {
    const ibkrBalance = 150.00;
    const ibkrCurrency = 'EUR';
    const actualBudgetCurrency = 'USD';
    const convertedIbkrBalance = 175.00; // Example converted value
    const currentActualBalanceInteger = 10000; // Represents 100.00 USD

    const testConfig = { ...config, actual: { ...config.actual, currency: actualBudgetCurrency } };

    mockedActualApi.getAccountBalance.mockResolvedValue(currentActualBalanceInteger);
    mockedConvertCurrency.mockResolvedValue(convertedIbkrBalance);

    await updateBudget({ balance: ibkrBalance, currency: ibkrCurrency }, testConfig);

    expect(mockedConvertCurrency).toHaveBeenCalledWith(ibkrBalance, ibkrCurrency, actualBudgetCurrency);
    const expectedDifference = convertedIbkrBalance - (currentActualBalanceInteger / 100);
    expect(mockedActualApi.addTransactions).toHaveBeenCalledWith(testConfig.actual.syncAccountId, [
      {
        account: testConfig.actual.syncAccountId,
        amount: Math.round(expectedDifference * 100),
        date: new Date().toISOString().split('T')[0],
        payee_name: 'IBKR Balance Adjustment',
        notes: 'Balance adjustment from Interactive Brokers',
      },
    ]);
  });

  it('should convert currency and add a withdrawal transaction if IBKR balance is lower and currencies differ', async () => {
    const ibkrBalance = 50.00;
    const ibkrCurrency = 'EUR';
    const actualBudgetCurrency = 'USD';
    const convertedIbkrBalance = 55.00; // Example converted value
    const currentActualBalanceInteger = 10000; // Represents 100.00 USD

    const testConfig = { ...config, actual: { ...config.actual, currency: actualBudgetCurrency } };

    mockedActualApi.getAccountBalance.mockResolvedValue(currentActualBalanceInteger);
    mockedConvertCurrency.mockResolvedValue(convertedIbkrBalance);

    await updateBudget({ balance: ibkrBalance, currency: ibkrCurrency }, testConfig);

    expect(mockedConvertCurrency).toHaveBeenCalledWith(ibkrBalance, ibkrCurrency, actualBudgetCurrency);
    const expectedDifference = convertedIbkrBalance - (currentActualBalanceInteger / 100);
    expect(mockedActualApi.addTransactions).toHaveBeenCalledWith(testConfig.actual.syncAccountId, [
      {
        account: testConfig.actual.syncAccountId,
        amount: Math.round(expectedDifference * 100),
        date: new Date().toISOString().split('T')[0],
        payee_name: 'IBKR Balance Adjustment',
        notes: 'Balance adjustment from Interactive Brokers',
      },
    ]);
  });

  it('should throw an error if currency conversion fails', async () => {
    const ibkrBalance = 100.00;
    const ibkrCurrency = 'EUR';
    const actualBudgetCurrency = 'USD';

    const testConfig = { ...config, actual: { ...config.actual, currency: actualBudgetCurrency } };

    mockedActualApi.getAccountBalance.mockResolvedValue(10000);
    mockedConvertCurrency.mockRejectedValue(new Error('Conversion failed'));

    await expect(updateBudget({ balance: ibkrBalance, currency: ibkrCurrency }, testConfig)).rejects.toThrow('Conversion failed');
  });
});
